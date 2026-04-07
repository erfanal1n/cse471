import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import type { SessionUser } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/signup", label: "Signup" },
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteShell({
  children,
  currentPath,
  session,
}: {
  children: ReactNode;
  currentPath: string;
  session: SessionUser | null;
}) {
  return (
    <div className="retro-page">
      <header className="retro-window">
        <div className="retro-banner">
          <div>
            <p className="retro-kicker">Inventory &amp; Order Management System</p>
            <h1>CSE471 Inventory Desk</h1>
            <p>
              Simple frontend starter with signup, login, logout, and a protected
              dashboard. More modules can be added on top of this base later.
            </p>
          </div>
          <div className="retro-stamp">
            <span>{session ? `Signed in as ${session.name}` : "Guest mode"}</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>

        <div className="retro-subnav">
          <nav className="retro-links" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="retro-navlink"
                data-active={currentPath === item.href}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-700">
              {session ? `${session.role} account` : "No user signed in"}
            </span>
            {session ? <LogoutButton /> : null}
          </div>
        </div>
      </header>

      <div className="mt-4">{children}</div>

      <footer className="retro-footer">
        Auth starter built with Next.js, Prisma, and MongoDB Atlas.
      </footer>
    </div>
  );
}
