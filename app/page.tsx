import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { ProductWorkspace } from "@/components/product-workspace";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";
import { serializeProduct } from "@/lib/product-catalog";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return (
      <SiteShell currentPath="/" session={session}>
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
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <SiteShell
      currentPath="/"
      pageTitle="Products"
      session={session}
    >
      <ProductWorkspace initialProducts={products.map(serializeProduct)} />
    </SiteShell>
  );
}
