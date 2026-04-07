import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validators";

export class OrderValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderValidationError";
    this.status = status;
  }
}

type OrderPayload = z.infer<typeof orderSchema>;

export function isValidObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function buildOrderWriteData(payload: OrderPayload) {
  const uniqueProductIds = [...new Set(payload.items.map((item) => item.productId))];

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: uniqueProductIds,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      sizes: true,
    },
  });

  const productsById = new Map(products.map((product) => [product.id, product]));

  if (productsById.size !== uniqueProductIds.length) {
    throw new OrderValidationError("One or more selected products no longer exist.");
  }

  const items = payload.items.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new OrderValidationError("One or more selected products no longer exist.");
    }

    if (!product.sizes.includes(item.size)) {
      throw new OrderValidationError(
        `${product.name} is not available in size ${item.size}.`,
      );
    }

    const unitPrice = product.price;
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      size: item.size,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Number(
    items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
  );

  return {
    orderData: {
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      shippingAddress: payload.shippingAddress,
      notes: payload.notes,
      status: payload.status,
      totalItems,
      totalAmount,
    },
    itemData: items,
  };
}
