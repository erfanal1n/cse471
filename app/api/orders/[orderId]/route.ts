import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma-client-v2/index.js";
import { getSession } from "@/lib/auth";
import { sendDeliveryReceiptEmail } from "@/lib/email-service";
import { serializeOrder } from "@/lib/order-management";
import {
  buildOrderWriteData,
  isValidObjectId,
  OrderValidationError,
} from "@/lib/order-write";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof OrderValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An order with this order number already exists." },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await context.params;

  if (!isValidObjectId(orderId)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = orderSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter valid order details." },
        { status: 400 },
      );
    }

    const { orderData, itemData } = await buildOrderWriteData(parsedBody.data);

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        ...orderData,
        items: {
          deleteMany: {},
          create: itemData,
        },
      },
      include: {
        items: true,
      },
    });

    console.log(`[Order PATCH] orderId=${orderId} | previousStatus=${existingOrder?.status} | newStatus=${order.status}`);

    if (existingOrder && existingOrder.status !== "DELIVERED" && order.status === "DELIVERED") {
      console.log(`[Order PATCH] Status transitioned to DELIVERED. Sending receipt to ${order.customerEmail}...`);
      await sendDeliveryReceiptEmail(serializeOrder(order));
    } else if (order.status === "DELIVERED") {
      console.log(`[Order PATCH] Order was already DELIVERED. Skipping receipt email.`);
    }

    return NextResponse.json({
      order: serializeOrder(order),
    });
  } catch (error) {
    console.error("Order update error:", error);

    return getWriteErrorResponse(error, "Unable to update the order right now.");
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await context.params;

  if (!isValidObjectId(orderId)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  try {
    await prisma.orderItem.deleteMany({
      where: {
        orderId,
      },
    });

    await prisma.order.delete({
      where: {
        id: orderId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Order delete error:", error);

    return getWriteErrorResponse(error, "Unable to delete the order right now.");
  }
}
