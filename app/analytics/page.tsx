import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { SiteShell } from "@/components/site-shell";
import { AnalyticsWorkspace } from "@/components/analytics-workspace";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/product-catalog";

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session) {
    return (
      <SiteShell currentPath="/analytics" session={session}>
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
      category: "asc",
    },
  });

  return (
    <SiteShell currentPath="/analytics" pageTitle="Inventory Analytics" session={session}>
      <AnalyticsWorkspace products={products.map(serializeProduct)} />
    </SiteShell>
  );
}
