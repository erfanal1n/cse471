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

  return (
    <SiteShell
      currentPath="/customers"
      pageTitle="Customers"
      session={session}
    >
      <CustomerWorkspace initialCustomers={customers.map(serializeCustomer)} />
    </SiteShell>
  );
}
