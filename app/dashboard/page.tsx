import { redirect } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const moduleRows = [
  {
    feature: "Product records",
    state: "Waiting for next module",
    detail: "Product CRUD, quantity edits, and barcode or QR-related work can be added next.",
  },
  {
    feature: "Order processing",
    state: "Waiting for next module",
    detail: "Customer orders, revenue calculation, and receipt handling will plug into this area.",
  },
  {
    feature: "Supplier management",
    state: "Waiting for next module",
    detail: "Supplier CRUD and sourcing records can share the same protected dashboard shell.",
  },
  {
    feature: "Analytics and alerts",
    state: "Waiting for next module",
    detail: "Low-stock warnings and reporting tiles can be mounted here later.",
  },
];

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <SiteShell currentPath="/dashboard" session={session}>
      <main className="space-y-4">
        <section className="retro-window">
          <div className="retro-window__title">Control Panel</div>
          <div className="grid gap-4 px-4 py-4 md:grid-cols-3">
            <div className="retro-panel">
              <p className="retro-stat__label">Signed In User</p>
              <p className="retro-stat__value">{user.name}</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
            <div className="retro-panel">
              <p className="retro-stat__label">Assigned Role</p>
              <p className="retro-stat__value">{user.role}</p>
              <p className="text-xs text-slate-600">Role-based access is ready for later modules.</p>
            </div>
            <div className="retro-panel">
              <p className="retro-stat__label">Project Status</p>
              <p className="retro-stat__value">Auth Online</p>
              <p className="text-xs text-slate-600">Database-backed signup and login are active.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="retro-window">
            <div className="retro-window__title">Profile Record</div>
            <div className="px-4 py-4">
              <table className="retro-profile-table">
                <tbody>
                  <tr>
                    <th>Member Name</th>
                    <td>{user.name}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{user.email}</td>
                  </tr>
                  <tr>
                    <th>Role</th>
                    <td>{user.role}</td>
                  </tr>
                  <tr>
                    <th>Joined</th>
                    <td>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(user.createdAt)}</td>
                  </tr>
                  <tr>
                    <th>Account ID</th>
                    <td className="break-all">{user.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="retro-window">
            <div className="retro-window__title">Next Step</div>
            <div className="space-y-3 px-4 py-4 text-sm leading-6 text-slate-800">
              <p>
                The auth flow is ready. The next module can now be added without changing
                the login system.
              </p>
              <div className="retro-notice">
                Suggested next step: build the first CRUD module and connect it here.
              </div>
              <div className="retro-panel">
                <h2 className="mb-2 text-base font-semibold text-slate-800">Why this helps</h2>
                <ul className="space-y-2">
                  <li>Users are already persisted in MongoDB through Prisma.</li>
                  <li>Routes can check the session before exposing module pages.</li>
                  <li>The dashboard style is reusable across the rest of the system.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="retro-window">
          <div className="retro-window__title">Module Runway</div>
          <div className="px-4 py-4">
            <div className="overflow-x-auto">
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>Upcoming Feature</th>
                    <th>State</th>
                    <th>Prepared Space</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleRows.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td>
                        <span className="retro-badge">{row.state}</span>
                      </td>
                      <td>{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
