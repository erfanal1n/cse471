"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    });
  };

  return (
    <button className="retro-button" disabled={isPending} onClick={handleLogout} type="button">
      {isPending ? "Signing out..." : "Log Out"}
    </button>
  );
}
