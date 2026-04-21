import { redirect } from "next/navigation";

import { CustomerWorkspace } from "@/components/customer-workspace";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";
import { serializeCustomer } from "@/lib/customer-directory";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const customers = await prisma.customer.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  const orders = await prisma.order.findMany();
  const orderCounts = orders.reduce((acc, order) => {
    const key = order.customerName.trim().toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let topCustomerInfo = null;
  let maxCount = 0;
  for (const customer of customers) {
    const count = orderCounts[customer.name.trim().toLowerCase()] || 0;
    if (count > maxCount) {
      maxCount = count;
      topCustomerInfo = { name: customer.name, count };
    }
  }

  return (
    <SiteShell
      currentPath="/customers"
      pageTitle="Customers"
      session={session}
    >
      <CustomerWorkspace 
        initialCustomers={customers.map(serializeCustomer)} 
        topCustomerInfo={topCustomerInfo} 
      />
    </SiteShell>
  );
}
