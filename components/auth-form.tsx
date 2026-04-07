"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type AuthMode = "login" | "signup";

const roleOptions = [
  { label: "Administrator", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Staff", value: "STAFF" },
] as const;

const buttonLabel: Record<AuthMode, string> = {
  login: "Sign In",
  signup: "Create Account",
};

const pendingLabel: Record<AuthMode, string> = {
  login: "Checking account...",
  signup: "Creating account...",
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setError("");

      const payload =
        mode === "signup"
          ? {
              name: String(formData.get("name") ?? ""),
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
              role: String(formData.get("role") ?? "STAFF"),
            }
          : {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
            };

      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <form className="retro-form" onSubmit={handleSubmit}>
      {mode === "signup" ? (
        <div className="retro-form__grid md:grid-cols-2">
          <div className="retro-field md:col-span-2">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Md Erfan Ul Haque"
              required
            />
          </div>
          <div className="retro-field md:col-span-2">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="retro-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              required
            />
          </div>
          <div className="retro-field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="STAFF">
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="retro-helper md:col-span-2">
            The role can be used later for access control on products, orders, suppliers,
            and admin-only pages.
          </p>
        </div>
      ) : (
        <div className="retro-form__grid">
          <div className="retro-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="retro-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
          </div>
        </div>
      )}

      {error ? <p className="retro-error">{error}</p> : null}

      <button className="retro-button" disabled={isPending} type="submit">
        {isPending ? pendingLabel[mode] : buttonLabel[mode]}
      </button>
    </form>
  );
}
