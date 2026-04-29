import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { SiteShell } from "@/components/site-shell";
import { SupplierWorkspace } from "@/components/supplier-workspace";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSupplier } from "@/lib/supplier-management";

export default async function SuppliersPage() {
  const session = await getSession();

  if (!session) {
    return (
      <SiteShell currentPath="/suppliers" session={session}>
        <main className="auth-panel">
          <section className="auth-card">
            <div className="auth-card__header">
              <h2>Login</h2>
            </div>
            <div className="auth-card__body">
              <AuthForm mode="login" />
              <p className="auth-card__footer">
                <Link href="/signup">Create account</Link>
              </p>
            </div>
          </section>
        </main>
      </SiteShell>
    );
  }

  const suppliers = await prisma.supplier.findMany({
    include: {
      products: {
        select: { id: true, name: true, sku: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const products = await prisma.product.findMany({
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });

  return (
    <SiteShell currentPath="/suppliers" pageTitle="Suppliers" session={session}>
      <SupplierWorkspace 
        initialSuppliers={suppliers.map(serializeSupplier)} 
        availableProducts={products}
      />
    </SiteShell>
  );
}
