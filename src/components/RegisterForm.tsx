"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PassType } from "@prisma/client";
import { PASS_LIST, PASSES, MAX_QUANTITY, formatInr } from "@/lib/pricing";
import { EVENT } from "@/lib/event";
import { CheckIcon, ShieldIcon } from "@/components/Icons";

/** Razorpay injects this global when its checkout bundle loads. */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (payload: unknown) => void) => void;
    };
  }
}

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Only mention remaining spots once they are genuinely scarce. Showing it too
 * early reads as manufactured urgency, which is worse than saying nothing.
 */
const LOW_STOCK_THRESHOLD = 40;

/** Loads the checkout bundle once, on demand, and resolves when it is ready. */
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Status = "idle" | "creating" | "paying" | "verifying";

export function RegisterForm({
  initialPass,
  seatsRemaining,
}: {
  initialPass: PassType;
  seatsRemaining: number | null;
}) {
  const router = useRouter();

  const [passType, setPassType] = useState<PassType>(initialPass);
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [agreed, setAgreed] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const pass = PASSES[passType];
  const busy = status !== "idle";

  const totals = useMemo(
    () => ({
      amountPaise: pass.pricePaise * quantity,
      seats: pass.seats * quantity,
    }),
    [pass, quantity],
  );

  const soldOut = seatsRemaining !== null && seatsRemaining <= 0;

  function validateLocally(): string | null {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim()))
      return "Please enter a valid email address.";
    const digits = phone.replace(/\D/g, "").replace(/^(91|0)/, "");
    if (!/^[6-9]\d{9}$/.test(digits))
      return "Enter a valid 10-digit Indian mobile number.";
    if (!agreed) return "Please accept the terms to continue.";
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const localError = validateLocally();
    if (localError) {
      setError(localError);
      return;
    }

    setStatus("creating");

    try {
      // 1. Ask our server for an order. It decides the amount, not us.
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          passType,
          quantity,
          website,
        }),
      });

      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        setError(order.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }

      // 2. Bring up Razorpay's hosted checkout.
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setError(
          "Could not load the payment window. Check your connection and try again.",
        );
        setStatus("idle");
        return;
      }

      setStatus("paying");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: `${EVENT.name} ${EVENT.year}`,
        description: `${order.passName} × ${quantity}`,
        order_id: order.orderId,
        prefill: order.prefill,
        notes: { bookingCode: order.bookingCode },
        theme: { color: "#C2185B" },
        retry: { enabled: false },

        // 3. Razorpay hands back a signature; our server is the one that
        //    decides whether it is genuine.
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStatus("verifying");
          try {
            const verifyResponse = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verifyResponse.json();

            if (!verifyResponse.ok) {
              setError(
                `${result.error ?? "We could not confirm your payment."} Your booking ID is ${order.bookingCode} — please send it to us on Instagram.`,
              );
              setStatus("idle");
              return;
            }
            router.push(result.ticketUrl);
          } catch {
            setError(
              `Your payment went through but confirmation failed. Save your booking ID (${order.bookingCode}) and message us on Instagram — we will sort it out.`,
            );
            setStatus("idle");
          }
        },

        modal: {
          ondismiss: () => {
            setStatus("idle");
            setError("Payment was cancelled. Your passes are not booked yet.");
          },
        },
      });

      checkout.on("payment.failed", () => {
        setStatus("idle");
        setError("The payment did not go through. Please try again.");
      });

      checkout.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  const buttonLabel = {
    idle: `Pay ${formatInr(totals.amountPaise)} securely`,
    creating: "Preparing your order…",
    paying: "Complete the payment…",
    verifying: "Confirming your ticket…",
  }[status];

  if (soldOut) {
    return (
      <div className="rounded-3xl border border-night-500/70 bg-night-800/60 p-9 text-center">
        <h2 className="font-display text-3xl text-gold-400">Sold out</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Every pass for {EVENT.name} {EVENT.year} is gone. Follow us on
          Instagram — we release returns there first.
        </p>
        <a
          href={EVENT.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-rose-500 px-7 py-3 text-sm font-semibold text-white"
        >
          @{EVENT.instagram}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ---------- Step 1: pass ---------- */}
      <fieldset disabled={busy} className="disabled:opacity-60">
        <legend className="text-[10px] uppercase tracking-[0.26em] text-rose-400">
          Step 1 · Choose your pass
        </legend>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PASS_LIST.map((option) => {
            const selected = option.id === passType;
            return (
              <label
                key={option.id}
                className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${
                  selected
                    ? "border-gold-500/70 bg-night-700/70 card-glow"
                    : "border-night-500/70 bg-night-800/45 hover:border-night-500"
                }`}
              >
                <input
                  type="radio"
                  name="passType"
                  value={option.id}
                  checked={selected}
                  onChange={() => {
                    setPassType(option.id);
                    setError(null);
                  }}
                  className="sr-only"
                />
                {selected && (
                  <CheckIcon className="absolute right-4 top-4 h-4 w-4 text-gold-400" />
                )}
                <p className="font-display text-lg font-semibold text-cream">
                  {option.name}
                </p>
                <p className="mt-1.5 font-display text-2xl text-gold-400">
                  {formatInr(option.pricePaise)}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Admits {option.seats}
                  {option.seats > 1 &&
                    ` · ${formatInr(option.perPersonPaise)} each`}
                </p>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-night-500/70 bg-night-800/45 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-cream">
              How many {pass.name} passes?
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Admits {totals.seats} {totals.seats === 1 ? "person" : "people"} in total
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="h-9 w-9 rounded-lg border border-night-500 text-lg text-cream transition-colors hover:border-gold-600/50 hover:text-gold-400 disabled:opacity-35"
            >
              −
            </button>
            <span
              className="w-10 text-center font-display text-xl tabular-nums text-gold-400"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              disabled={quantity >= MAX_QUANTITY}
              aria-label="Increase quantity"
              className="h-9 w-9 rounded-lg border border-night-500 text-lg text-cream transition-colors hover:border-gold-600/50 hover:text-gold-400 disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>
      </fieldset>

      {/* ---------- Step 2: who's coming ---------- */}
      <fieldset disabled={busy} className="disabled:opacity-60">
        <legend className="text-[10px] uppercase tracking-[0.26em] text-rose-400">
          Step 2 · Your details
        </legend>

        <div className="mt-4 space-y-4">
          <Field
            id="fullName"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            placeholder="Ananya Sharma"
            autoComplete="name"
            maxLength={80}
          />
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={160}
            hint="Your QR ticket is sent here — please double-check it."
          />
          <Field
            id="phone"
            label="Mobile number"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="98765 43210"
            autoComplete="tel"
            maxLength={15}
            hint="Used only if we need to reach you about the event."
          />

          {/* Honeypot — hidden from people, irresistible to bots. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* ---------- Summary + pay ---------- */}
      <div className="rounded-2xl border border-gold-600/30 bg-night-800/60 p-6">
        <div className="flex items-center justify-between text-sm text-cream/80">
          <span>
            {pass.name} × {quantity}
          </span>
          <span className="tabular-nums">{formatInr(totals.amountPaise)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Admits</span>
          <span>
            {totals.seats} {totals.seats === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-night-500/60 pt-4">
          <span className="font-display text-lg text-cream">Total</span>
          <span className="font-display text-3xl font-bold text-gold-400 tabular-nums">
            {formatInr(totals.amountPaise)}
          </span>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              setError(null);
            }}
            disabled={busy}
            className="mt-0.5 h-5 w-5 shrink-0 accent-rose-500"
          />
          <span>
            I confirm my details are correct and I accept that passes are{" "}
            <a href="/refunds" className="text-gold-500 underline underline-offset-2">
              non-refundable
            </a>{" "}
            but transferable, and the{" "}
            <a href="/terms" className="text-gold-500 underline underline-offset-2">
              terms
            </a>
            .
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-500/40 bg-rose-600/12 px-4 py-3 text-sm leading-relaxed text-rose-200"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-900/40 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {busy && (
            <span
              className="mr-2.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white align-[-2px]"
              aria-hidden="true"
            />
          )}
          {buttonLabel}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted">
          <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-gold-600" />
          Payments are processed by Razorpay. We never see your card or UPI details.
        </p>

        {seatsRemaining !== null && seatsRemaining <= LOW_STOCK_THRESHOLD && (
          <p className="mt-2.5 text-center text-xs text-rose-300">
            Only {seatsRemaining} {seatsRemaining === 1 ? "spot" : "spots"} left!
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-cream/85">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-1.5 w-full rounded-xl border border-night-500 bg-night-900/70 px-4 py-3 text-cream placeholder:text-muted/45 transition-colors focus:border-gold-600/70 focus:outline-none focus:ring-1 focus:ring-gold-600/40"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
