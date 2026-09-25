import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/qr";
import { env } from "@/lib/env";
import { EVENT, mapsUrl, sharePassOnWhatsAppUrl } from "@/lib/event";
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
  const end = EVENT.endsAt;
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
  const passUrl = `${env.siteUrl}/ticket/${ticket.token}`;
  const qr = await qrDataUrl(passUrl);

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

        {/* Saving the pass is the primary action: there is no confirmation
            email, so this image is the guest's copy of their ticket. */}
        <a
          href={`/ticket/${ticket.token}/download`}
          className="mt-6 flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-4 text-center text-base font-semibold text-white shadow-lg shadow-rose-900/40 transition-all hover:-translate-y-0.5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
          </svg>
          Download your pass
        </a>

        {/* Second copy, in the place most guests will actually look for it on
            the night. The link opens their own WhatsApp with the pass ready to
            send — to themselves, or to whoever they are coming with. */}
        <a
          href={sharePassOnWhatsAppUrl(
            passUrl,
            registration.fullName.split(" ")[0],
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2.5 rounded-full border border-[#25D366]/45 px-6 py-3.5 text-center text-sm font-medium text-[#25D366] transition-all hover:-translate-y-0.5 hover:bg-[#25D366]/10"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Send to WhatsApp
        </a>

        <a
          href={calendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block rounded-full border border-gold-600/45 px-6 py-3.5 text-center text-sm font-medium text-gold-400 transition-all hover:-translate-y-0.5 hover:bg-gold-500/8"
        >
          Add to Google Calendar
        </a>

        <div className="mt-6 rounded-2xl border border-gold-600/25 bg-night-800/50 p-5">
          <p className="text-xs font-semibold text-gold-400">
            Save your pass now
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Download it to your phone — that image is your entry, and you will
            not need this page again. Lost it? Recover it any time at{" "}
            <Link
              href="/find"
              className="text-gold-500 underline underline-offset-2"
            >
              Find my pass
            </Link>
            , using the email and phone number you booked with.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Keep the QR private — anyone holding it can use your entry, and
            each pass scans only once.
          </p>
        </div>

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
