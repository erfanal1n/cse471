import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <SiteShell currentPath="/login" session={session}>
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
