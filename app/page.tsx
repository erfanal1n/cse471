import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";

const launchBoard = [
  {
    module: "Authentication",
    status: "Ready",
    note: "Signup, login, logout, protected dashboard, and stored user roles.",
  },
  {
    module: "Products",
    status: "Later",
    note: "Product CRUD and stock tracking can be added next.",
  },
  {
    module: "Orders",
    status: "Later",
    note: "Order handling and revenue tracking can use the same login system.",
  },
  {
    module: "Suppliers",
    status: "Later",
    note: "Supplier records and external integrations can be added after that.",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <SiteShell currentPath="/" session={session}>
      <main className="space-y-4">
        <section className="retro-window">
          <div className="retro-window__title">Project Overview</div>
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">
                Clean auth starter for your project
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                The backend setup is ready for user accounts, and the frontend is now kept
                simple with a white dashboard-style layout. This gives you a clean base
                for the module features you will add later.
              </p>
              <div className="retro-notice">
                Current focus: account creation, login, logout, protected dashboard, and
                MongoDB user storage through Prisma.
              </div>
            </div>
            <aside className="retro-panel space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Quick access</h2>
              <p className="text-sm leading-7 text-slate-600">
                {session
                  ? `You are signed in as ${session.name}.`
                  : "Create the first account or log in to continue."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {session ? (
                  <Link className="retro-button text-center" href="/dashboard">
                    Open Dashboard
                  </Link>
                ) : (
                  <>
                    <Link className="retro-button text-center" href="/signup">
                      Create Account
                    </Link>
                    <Link className="retro-button text-center" href="/login">
                      Log In
                    </Link>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="retro-window">
            <div className="retro-window__title">Tech Stack</div>
            <div className="space-y-2 px-5 py-5 text-sm leading-7 text-slate-600">
              <p>Next.js + TypeScript</p>
              <p>Tailwind CSS</p>
              <p>MongoDB Atlas</p>
              <p>Prisma ORM</p>
            </div>
          </div>
          <div className="retro-window">
            <div className="retro-window__title">Current Scope</div>
            <div className="space-y-2 px-5 py-5 text-sm leading-7 text-slate-600">
              <p>Signup page</p>
              <p>Login page</p>
              <p>Logout flow</p>
              <p>Protected dashboard</p>
            </div>
          </div>
          <div className="retro-window">
            <div className="retro-window__title">Next Modules</div>
            <div className="space-y-2 px-5 py-5 text-sm leading-7 text-slate-600">
              {launchBoard.slice(1).map((item) => (
                <p key={item.module}>{item.module}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
