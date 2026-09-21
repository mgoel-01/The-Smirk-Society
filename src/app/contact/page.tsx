import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, EVENT, mapsUrl, whatsappUrl } from "@/lib/event";
import { env } from "@/lib/env";
import { Divider } from "@/components/Decor";
import {
  ClockIcon,
  InstagramIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/Icons";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${EVENT.host} about ${EVENT.name} ${EVENT.year} — bookings, tickets and event queries.`,
};

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
    </svg>
  );
}

/** One contact channel. Nothing renders if the detail is missing. */
function Channel({
  Icon,
  label,
  value,
  href,
  external,
  accent,
}: {
  Icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  accent?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-4 rounded-2xl border border-night-500/70 bg-night-800/55 p-5 transition-all hover:-translate-y-0.5 hover:border-gold-600/45 hover:bg-night-700/55"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-600/30 bg-night-900/60"
        style={accent ? { color: accent } : undefined}
      >
        <Icon className={`h-5 w-5 ${accent ? "" : "text-gold-500"}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-cream transition-colors group-hover:text-gold-400">
          {value}
        </span>
      </span>
    </a>
  );
}

export default function ContactPage() {
  const whatsapp = whatsappUrl();

  return (
    <div className="min-h-screen">
      <header className="border-b border-night-600/50 bg-night-900/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
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
            className="text-sm text-cream/70 transition-colors hover:text-gold-400"
          >
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-center font-display text-4xl font-semibold text-cream">
          Contact Us
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted">
          Questions about passes, payments or the event itself? Reach us on any
          of these — Instagram DMs are usually fastest.
        </p>
        <Divider className="mx-auto mt-6 max-w-xs" />

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Channel
            Icon={InstagramIcon}
            label="Instagram"
            value={`@${EVENT.instagram}`}
            href={EVENT.instagramUrl}
            external
          />

          <Channel
            Icon={MailIcon}
            label="Email"
            value={env.supportEmail}
            href={`mailto:${env.supportEmail}`}
          />

          {whatsapp && (
            <Channel
              Icon={WhatsAppIcon}
              label="WhatsApp"
              value="Chat with us"
              href={whatsapp}
              external
              accent="#25D366"
            />
          )}

          {CONTACT.phone && (
            <Channel
              Icon={PhoneIcon}
              label="Phone"
              value={CONTACT.phone}
              href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
            />
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-night-500/70 bg-night-800/55 p-6">
            <div className="flex items-center gap-2.5">
              <ClockIcon className="h-4 w-4 text-gold-500" />
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted">
                We reply
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-cream/85">
              {CONTACT.hours}. Booking queries are answered within 24 hours, and
              refund requests within 3 working days.
            </p>
          </div>

          <div className="rounded-2xl border border-night-500/70 bg-night-800/55 p-6">
            <div className="flex items-center gap-2.5">
              <PinIcon className="h-4 w-4 text-gold-500" />
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted">
                Event venue
              </h2>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-sm leading-relaxed text-cream/85 underline decoration-gold-600/40 underline-offset-2 hover:text-gold-400"
            >
              {EVENT.venue}, {EVENT.venueArea}
            </a>
            <p className="mt-1.5 text-xs text-muted">
              {EVENT.dateLabel} · {EVENT.timeLabel}
            </p>
          </div>
        </div>

        {CONTACT.address && (
          <div className="mt-3 rounded-2xl border border-night-500/70 bg-night-800/55 p-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Registered address
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-cream/85">
              {CONTACT.address}
            </p>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-gold-600/25 bg-night-800/45 p-6">
          <h2 className="font-display text-lg text-gold-400">
            Already booked?
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-cream/80">
            Have your <span className="text-cream">booking ID</span> ready (it
            looks like <span className="font-mono text-gold-500">SNR-7K3M9Q</span>{" "}
            and is in your confirmation email). Quoting it lets us find your
            booking straight away.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/80">
            Didn&rsquo;t get your ticket email? Check spam and promotions first,
            then message us — we can resend it.
          </p>
        </div>

        <p className="mt-12 border-t border-night-600/60 pt-7 text-center text-xs text-muted">
          Organised by {EVENT.host}. See our{" "}
          <Link href="/terms" className="text-gold-500 underline underline-offset-2">
            terms
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-gold-500 underline underline-offset-2">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link href="/refunds" className="text-gold-500 underline underline-offset-2">
            refund policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
