"use client";

import Link from "next/link";
import { useState } from "react";
import type { PassType } from "@prisma/client";
import { PASS_LIST, PASSES, MAX_QUANTITY, formatInr } from "@/lib/pricing";

type Issued = {
  bookingCode: string;
  passName: string;
  quantity: number;
  seats: number;
  amountPaise: number;
  tickets: { token: string; seats: number }[];
};

const METHODS = [
  { id: "cash", label: "Cash" },
  { id: "upi-direct", label: "UPI to me" },
  { id: "bank-transfer", label: "Bank transfer" },
  { id: "complimentary", label: "Complimentary" },
] as const;

export default function IssuePassPage() {
  const [passType, setPassType] = useState<PassType>("SINGLE");
  const [quantity, setQuantity] = useState(1);
  const [groupSize, setGroupSize] = useState(PASSES.GROUP4.sizeRange!.min);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof METHODS)[number]["id"]>("cash");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);

  const pass = PASSES[passType];
  const seatsPerPass = pass.sizeRange ? groupSize : pass.seats;
  const perPassPaise = pass.sizeRange
    ? groupSize * pass.perPersonPaise
    : pass.pricePaise;
  const total = perPassPaise * quantity;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIssued(null);
    setBusy(true);

    try {
      const response = await fetch("/api/admin/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          passType,
          quantity,
          ...(pass.sizeRange ? { groupSize } : {}),
          paymentMethod,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Could not issue the pass.");
        return;
      }
      setIssued(result);
      setFullName("");
      setEmail("");
      setPhone("");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-night-600/50 bg-night-900/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <h1 className="font-display text-xl text-cream">Issue a pass</h1>
          <Link
            href="/admin"
            className="px-2 py-2 text-sm text-muted transition-colors hover:text-gold-400"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        <p className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 text-sm leading-relaxed text-amber-100">
          For guests who paid you directly — cash at the gate, UPI to your own
          number, or a comp. This creates a <strong>real, valid pass</strong>{" "}
          with no payment taken online, so only use it once the money is
          actually in hand.
        </p>

        {issued && (
          <div className="mt-5 rounded-2xl border border-emerald-400/45 bg-emerald-500/10 p-6">
            <p className="font-display text-2xl text-emerald-300">
              Pass issued
            </p>
            <p className="mt-2 font-mono text-lg font-bold tracking-[0.15em] text-gold-400">
              {issued.bookingCode}
            </p>
            <p className="mt-1 text-sm text-cream/85">
              {issued.passName} × {issued.quantity} · admits {issued.seats} ·{" "}
              {formatInr(issued.amountPaise)}
            </p>
            <p className="mt-4 text-xs text-muted">
              Send the guest their pass — open it, then share the link or the
              downloaded image.
            </p>
            <div className="mt-3 space-y-2">
              {issued.tickets.map((t, i) => (
                <div key={t.token} className="flex gap-2">
                  <Link
                    href={`/ticket/${t.token}`}
                    target="_blank"
                    className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-rose-400"
                  >
                    {issued.tickets.length > 1 ? `Pass ${i + 1}` : "Open pass"} ·
                    admits {t.seats}
                  </Link>
                  <a
                    href={`/ticket/${t.token}/download`}
                    className="rounded-xl border border-gold-600/45 px-4 py-2.5 text-sm text-gold-400 hover:bg-gold-500/8"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Pass
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {PASS_LIST.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPassType(option.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    option.id === passType
                      ? "border-gold-500/70 bg-night-700/70"
                      : "border-night-500/70 bg-night-800/45 hover:border-night-500"
                  }`}
                >
                  <span className="block text-sm font-medium text-cream">
                    {option.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gold-400">
                    {option.sizeRange ? "from " : ""}
                    {formatInr(option.pricePaise)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {pass.sizeRange && (
            <Stepper
              label="People in the group"
              hint={`${pass.sizeRange.min} to ${pass.sizeRange.max}`}
              value={groupSize}
              min={pass.sizeRange.min}
              max={pass.sizeRange.max}
              onChange={setGroupSize}
            />
          )}

          <Stepper
            label="Number of passes"
            hint={`Admits ${seatsPerPass * quantity} in total`}
            value={quantity}
            min={1}
            max={MAX_QUANTITY}
            onChange={setQuantity}
          />

          <AdminField id="fullName" label="Guest name" value={fullName} onChange={setFullName} />
          <AdminField id="email" label="Email" type="email" value={email} onChange={setEmail} />
          <AdminField id="phone" label="Mobile number" type="tel" value={phone} onChange={setPhone} />

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">
              How did they pay?
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    m.id === paymentMethod
                      ? "border-gold-500/70 bg-night-700/70 text-cream"
                      : "border-night-500/70 bg-night-800/45 text-muted hover:text-cream"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gold-600/30 bg-night-800/60 p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-cream/80">Amount to collect</span>
              <span className="font-display text-2xl font-bold text-gold-400">
                {paymentMethod === "complimentary" ? "Free" : formatInr(total)}
              </span>
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
              className="mt-4 w-full rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-3.5 text-base font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Issuing…" : "Issue pass"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-night-500/70 bg-night-800/45 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-cream">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="h-9 w-9 rounded-lg border border-night-500 text-lg text-cream disabled:opacity-35"
        >
          &minus;
        </button>
        <span className="w-10 text-center font-display text-xl tabular-nums text-gold-400">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="h-9 w-9 rounded-lg border border-night-500 text-lg text-cream disabled:opacity-35"
        >
          +
        </button>
      </div>
    </div>
  );
}

function AdminField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-cream/85">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1.5 w-full rounded-xl border border-night-500 bg-night-900/70 px-4 py-3 text-cream focus:border-gold-600/70 focus:outline-none"
      />
    </div>
  );
}
