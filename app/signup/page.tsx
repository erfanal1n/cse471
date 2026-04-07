import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <SiteShell currentPath="/signup" session={session}>
      <main className="grid gap-4 lg:grid-cols-[0.72fr_1fr]">
        <section className="retro-window">
          <div className="retro-window__title">Create Account</div>
          <div className="space-y-3 px-4 py-4 text-sm leading-6 text-slate-800">
            <p>
              Create the first account for the system. This saves the user in MongoDB and
              opens the protected dashboard right away.
            </p>
            <div className="retro-panel">
              <h2 className="mb-2 text-base font-semibold text-slate-800">Prepared for later modules</h2>
              <ul className="space-y-2">
                <li>Role selection</li>
                <li>Protected routes</li>
                <li>User profile base</li>
              </ul>
            </div>
            <p>
              Already have an account? <Link href="/login">Go to login</Link>.
            </p>
          </div>
        </section>

        <section className="retro-window">
          <div className="retro-window__title">New User Registration</div>
          <div className="px-4 py-4">
            <AuthForm mode="signup" />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
