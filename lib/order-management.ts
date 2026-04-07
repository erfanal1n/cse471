export const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export type OrderCatalogItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  shippingAddress: string;
  notes: string | null;
  status: OrderStatusValue;
  totalItems: number;
  totalAmount: number;
  items: OrderCatalogItemLine[];
  createdAt: string;
  updatedAt: string;
};

export type OrderCatalogItemLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type OrderLike = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  shippingAddress: string;
  notes: string | null;
  status: OrderStatusValue;
  totalItems: number;
  totalAmount: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    size: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeOrder(order: OrderLike): OrderCatalogItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    notes: order.notes,
    status: order.status,
    totalItems: order.totalItems,
    totalAmount: order.totalAmount,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function formatOrderStatus(status: OrderStatusValue) {
  return ORDER_STATUS_LABELS[status];
}
