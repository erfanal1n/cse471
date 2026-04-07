import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <SiteShell currentPath="/signup" session={session}>
      <main className="auth-panel auth-panel--wide">
        <section className="auth-card">
          <div className="auth-card__header">
            <h2>Create Account</h2>
          </div>
          <div className="auth-card__body">
            <AuthForm mode="signup" />
            <p className="auth-card__footer">
              <Link href="/login">Back to login</Link>
            </p>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
