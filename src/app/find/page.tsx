"use client";

import Link from "next/link";
import { useState } from "react";
import { EVENT } from "@/lib/event";
import { Divider } from "@/components/Decor";

type Ticket = { token: string; seats: number; used: boolean };
type Booking = {
  bookingCode: string;
  passName: string;
  quantity: number;
  seats: number;
  bookedAt: string;
  tickets: Ticket[];
};

export default function FindTicketPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBookings(null);
    setBusy(true);

    try {
      const response = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setBookings(result.bookings);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen festival-haze">
      <header className="border-b border-night-600/50 bg-night-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-[0.28em] text-muted">
              {EVENT.host}
            </span>
            <span className="font-script text-xl text-gold-400">
              {EVENT.name}
            </span>
          </Link>
          <Link
            href="/"
            className="-mr-2 px-2 py-2 text-sm text-cream/70 transition-colors hover:text-gold-400"
          >
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 py-12">
        <h1 className="text-center font-display text-4xl font-semibold text-cream">
          Find my <span className="foil">pass</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted">
          Enter the email address and mobile number you booked with, and
          we&rsquo;ll bring your passes back up.
        </p>
        <Divider className="mx-auto mt-6 max-w-xs" />

        <form onSubmit={handleSubmit} className="mt-10 space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-cream/85"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={busy}
              className="mt-1.5 w-full rounded-xl border border-night-500 bg-night-900/70 px-4 py-3 text-cream placeholder:text-muted/45 focus:border-gold-600/70 focus:outline-none focus:ring-1 focus:ring-gold-600/40 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-cream/85"
            >
              Mobile number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              autoComplete="tel"
              required
              disabled={busy}
              className="mt-1.5 w-full rounded-xl border border-night-500 bg-night-900/70 px-4 py-3 text-cream placeholder:text-muted/45 focus:border-gold-600/70 focus:outline-none focus:ring-1 focus:ring-gold-600/40 disabled:opacity-60"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-600/12 px-4 py-3 text-sm text-rose-200"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-rose-900/40 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-65"
          >
            {busy ? "Looking…" : "Find my pass"}
          </button>
        </form>

        {bookings !== null && bookings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-night-500/70 bg-night-800/55 p-6 text-center">
            <p className="text-sm text-cream/85">
              No paid bookings found with those details.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Check for typos — the email and mobile number must both match what
              you entered when booking. If you are sure they are right, message
              us on{" "}
              <a
                href={EVENT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 underline underline-offset-2"
              >
                Instagram
              </a>{" "}
              and we will sort it out.
            </p>
          </div>
        )}

        {bookings !== null && bookings.length > 0 && (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.bookingCode}
                className="card-glow rounded-2xl border border-gold-600/30 bg-night-800/60 p-6"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-sm font-bold tracking-[0.15em] text-gold-400">
                    {booking.bookingCode}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(booking.bookedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-cream/85">
                  {booking.passName} × {booking.quantity} · admits{" "}
                  {booking.seats}
                </p>

                <div className="mt-4 space-y-2">
                  {booking.tickets.map((ticket, i) => (
                    <div key={ticket.token} className="flex gap-2">
                      <Link
                        href={`/ticket/${ticket.token}`}
                        className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-rose-400"
                      >
                        {booking.tickets.length > 1
                          ? `Pass ${i + 1}`
                          : "View pass"}
                        {ticket.used && " ✓ used"}
                      </Link>
                      <a
                        href={`/ticket/${ticket.token}/download`}
                        className="rounded-xl border border-gold-600/45 px-4 py-2.5 text-sm text-gold-400 transition-colors hover:bg-gold-500/8"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
