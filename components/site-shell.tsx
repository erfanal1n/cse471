import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import type { SessionUser } from "@/lib/auth";

export function SiteShell({
  children,
  currentPath,
  session,
  pageTitle,
}: {
  children: ReactNode;
  currentPath: string;
  session: SessionUser | null;
  pageTitle?: string;
}) {
  if (!session) {
    return (
      <div className="auth-shell">
        <div className="auth-shell__frame">
          <div className="auth-shell__brand">
            <p className="auth-shell__eyebrow">CSE471</p>
            <div className="auth-shell__title-panel">
              <h1>Inventory &amp; Order Management System</h1>
            </div>
          </div>
          <div className="auth-shell__content">{children}</div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/", label: "Products", active: currentPath === "/" },
    { href: "/orders", label: "Orders", active: currentPath === "/orders" },
    { href: "#", label: "Customers", muted: true },
    { href: "#", label: "Suppliers", muted: true },
  ];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <p>CSE471</p>
          <h1>Inventory &amp; Order Management System</h1>
        </div>

        <nav className="dashboard-sidebar__nav" aria-label="Primary">
          {navItems.map((item) =>
            item.muted ? (
              <span key={item.label} className="dashboard-sidebar__item" data-muted="true">
                {item.label}
              </span>
            ) : (
              <Link
                key={item.label}
                className="dashboard-sidebar__item"
                data-active={item.active}
                href={item.href}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="dashboard-sidebar__footer">
          <div>
            <strong>{session.name}</strong>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <h2>{pageTitle ?? "Products"}</h2>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
