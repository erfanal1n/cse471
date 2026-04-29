import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { QRWorkspace } from "@/components/qr-workspace";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/product-catalog";

export default async function QRCodePage() {
  const session = await getSession();

  if (!session) {
    return (
      <SiteShell currentPath="/qrcode" session={session}>
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

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      sizes: true,
      price: true,
      stockQuantity: true,
      createdAt: true,
      updatedAt: true,
      supplierId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <SiteShell
      currentPath="/qrcode"
      pageTitle="QR Generator"
      session={session}
    >
      <QRWorkspace products={products.map(serializeProduct)} />
    </SiteShell>
  );
}
