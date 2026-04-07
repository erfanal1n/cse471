import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <SiteShell currentPath="/login" session={session}>
      <main className="grid gap-4 lg:grid-cols-[0.7fr_1fr]">
        <section className="retro-window">
          <div className="retro-window__title">Sign In</div>
          <div className="space-y-3 px-4 py-4 text-sm leading-6 text-slate-800">
            <p>
              Log in with the account you created for this system.
            </p>
            <div className="retro-panel">
              <h2 className="mb-2 text-base font-semibold text-slate-800">Included in this starter</h2>
              <ul className="space-y-2">
                <li>Password hashing</li>
                <li>Secure session cookie</li>
                <li>Role-ready user record</li>
              </ul>
            </div>
            <p>
              Need a new account? <Link href="/signup">Head to the signup page</Link>.
            </p>
          </div>
        </section>

        <section className="retro-window">
          <div className="retro-window__title">Account Access</div>
          <div className="px-4 py-4">
            <AuthForm mode="login" />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
