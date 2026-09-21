"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EVENT } from "@/lib/event";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Could not sign in.");
        setBusy(false);
        return;
      }

      // Only ever follow an internal path — never an attacker-supplied URL.
      const next = searchParams.get("next");
      const destination =
        next && next.startsWith("/admin/") && !next.startsWith("//")
          ? next
          : "/admin";

      router.push(destination);
      router.refresh();
    } catch {
      setError("Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-[0.28em] text-muted">
          {EVENT.host}
        </p>
        <h1 className="mt-2 font-script text-4xl text-gold-400">
          {EVENT.name}
        </h1>
        <p className="mt-3 text-sm text-muted">Organiser sign in</p>
      </div>

      <div className="mt-8">
        <label htmlFor="password" className="block text-sm text-cream/85">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="mt-1.5 w-full rounded-xl border border-night-500 bg-night-900/70 px-4 py-3 text-cream transition-colors focus:border-gold-600/70 focus:outline-none focus:ring-1 focus:ring-gold-600/40"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-500/40 bg-rose-600/12 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-rose-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-rose-400 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 festival-haze">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
