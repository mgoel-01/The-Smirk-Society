import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/qr";
import { env } from "@/lib/env";
import { EVENT, mapsUrl } from "@/lib/event";
import { PASSES, formatInr } from "@/lib/pricing";
import { CalendarIcon, ClockIcon, PinIcon } from "@/components/Icons";

// The token is a capability. Keep this page out of search engines and caches.
export const metadata: Metadata = {
  title: "Your pass",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

function calendarUrl(): string {
  const start = EVENT.startsAt;
  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${EVENT.name} ${EVENT.year} — ${EVENT.tagline}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `${EVENT.blurb} Presented by ${EVENT.host}.`,
    location: `${EVENT.venue}, ${EVENT.venueArea}`,
  });
  return `https://www.google.com/calendar/render?${params}`;
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Reject anything that is not shaped like a token before touching the DB.
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) notFound();

  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: { registration: { include: { tickets: true } } },
  });

  if (!ticket || ticket.registration.status !== "PAID") notFound();

  const registration = ticket.registration;
  const pass = PASSES[registration.passType];
  const qr = await qrDataUrl(`${env.siteUrl}/ticket/${ticket.token}`);

  const siblings = registration.tickets.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const index = siblings.findIndex((t) => t.id === ticket.id);

  return (
    <div className="min-h-screen festival-haze">
      <main className="mx-auto max-w-md px-5 py-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/12">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-emerald-400"
              aria-hidden="true"
            >
              <path d="m4.5 12.5 5 5 10-11" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-cream">
            You&rsquo;re in!
          </h1>
          <p className="mt-2 text-sm text-muted">
            Show this QR code at the entrance.
          </p>
        </div>

        {/* The pass itself — styled as a torn-stub ticket. */}
        <div className="card-glow mt-8 overflow-hidden rounded-3xl border border-gold-600/35 bg-night-800/75">
          <div className="bg-gradient-to-r from-wine-600 via-rose-600 to-wine-600 px-6 py-4 text-center">
            <p className="text-[9px] uppercase tracking-[0.28em] text-gold-300">
              {EVENT.host}
            </p>
            <p className="font-script text-2xl leading-tight text-white">
              {EVENT.name} {EVENT.year}
            </p>
          </div>

          <div className="bg-white px-6 py-7 text-center">
            {/* A data: URI needs no optimisation, so a plain <img> is both
                simpler and faster here than next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={`QR code for booking ${registration.bookingCode}`}
              width={240}
              height={240}
              className="mx-auto h-auto w-full max-w-[240px]"
            />
            <p className="mt-3 font-mono text-sm font-bold tracking-[0.18em] text-night-800">
              {registration.bookingCode}
            </p>
            {siblings.length > 1 && (
              <p className="mt-1 text-[11px] text-night-600">
                Pass {index + 1} of {siblings.length}
              </p>
            )}
          </div>

          {/* Perforation */}
          <div className="relative h-0">
            <div className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-night-900" />
            <div className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-night-900" />
          </div>

          <dl className="space-y-3 px-6 py-6 text-sm">
            <Row label="Name" value={registration.fullName} />
            <Row label="Pass" value={`${pass.name} × ${registration.quantity}`} />
            <Row
              label="This QR admits"
              value={`${ticket.seats} ${ticket.seats === 1 ? "person" : "people"}`}
              highlight
            />
            <Row label="Amount paid" value={formatInr(registration.amountPaise)} />
            {ticket.checkedInAt && (
              <Row
                label="Checked in"
                value={ticket.checkedInAt.toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            )}
          </dl>

          <div className="space-y-3 border-t border-night-500/60 px-6 py-6 text-sm">
            <div className="flex items-start gap-3">
              <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <span className="text-cream/85">
                {EVENT.dayLabel}, {EVENT.dateLabel}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <span className="text-cream/85">{EVENT.timeLabel}</span>
            </div>
            <div className="flex items-start gap-3">
              <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream/85 underline decoration-gold-600/40 underline-offset-2 hover:text-gold-400"
              >
                {EVENT.venue}, {EVENT.venueArea}
              </a>
            </div>
          </div>
        </div>

        {siblings.length > 1 && (
          <div className="mt-6 rounded-2xl border border-night-500/70 bg-night-800/50 p-5">
            <p className="text-xs font-medium text-cream/85">
              Your other passes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {siblings.map((sibling, i) =>
                sibling.id === ticket.id ? (
                  <span
                    key={sibling.id}
                    className="rounded-lg border border-gold-600/50 bg-night-700 px-3 py-1.5 text-xs text-gold-400"
                  >
                    Pass {i + 1}
                  </span>
                ) : (
                  <Link
                    key={sibling.id}
                    href={`/ticket/${sibling.token}`}
                    className="rounded-lg border border-night-500 px-3 py-1.5 text-xs text-cream/75 transition-colors hover:border-gold-600/45 hover:text-gold-400"
                  >
                    Pass {i + 1}
                    {sibling.checkedInAt && " ✓"}
                  </Link>
                ),
              )}
            </div>
          </div>
        )}

        <a
          href={calendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block rounded-full border border-gold-600/45 px-6 py-3.5 text-center text-sm font-medium text-gold-400 transition-all hover:-translate-y-0.5 hover:bg-gold-500/8"
        >
          Add to Google Calendar
        </a>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          Screenshot this page so you have it offline. Keep the QR private —
          anyone holding it can use your entry, and each pass scans only once.
        </p>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-muted transition-colors hover:text-gold-400"
        >
          &larr; Back to the event
        </Link>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`text-right font-medium ${
          highlight ? "text-gold-400" : "text-cream"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
