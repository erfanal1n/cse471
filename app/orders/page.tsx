import { redirect } from "next/navigation";

import { OrderWorkspace } from "@/components/order-workspace";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";
import { serializeOrder } from "@/lib/order-management";
import { serializeProduct } from "@/lib/product-catalog";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <SiteShell
      currentPath="/orders"
      pageTitle="Orders"
      session={session}
    >
      <OrderWorkspace
        initialOrders={orders.map(serializeOrder)}
        initialProducts={products.map(serializeProduct)}
      />
    </SiteShell>
  );
}
