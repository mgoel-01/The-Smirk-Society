"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** CSV download + sign out. Client-side because both need browser APIs. */
export function AdminActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5">
      <a
        href="/api/admin/registrations?format=csv"
        className="rounded-full border border-gold-600/45 px-5 py-2.5 text-sm text-gold-400 transition-colors hover:bg-gold-500/8"
      >
        Download CSV
      </a>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="rounded-full border border-night-500 px-5 py-2.5 text-sm text-muted transition-colors hover:text-cream disabled:opacity-60"
      >
        Sign out
      </button>
    </div>
  );
}
