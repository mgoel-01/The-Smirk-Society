import Link from "next/link";
import type { Metadata } from "next";
import type { PassType } from "@prisma/client";
import { EVENT } from "@/lib/event";
import { seatsRemaining } from "@/lib/booking";
import { RegisterForm } from "@/components/RegisterForm";
import { Divider } from "@/components/Decor";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CalendarIcon, ClockIcon, PinIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Book your pass",
  description: `Reserve your pass for ${EVENT.name} ${EVENT.year} — ${EVENT.dateLabel} at ${EVENT.venue}, ${EVENT.venueArea}.`,
};

// Availability must be live, never served from a cache.
export const dynamic = "force-dynamic";

const VALID_PASSES: PassType[] = ["SINGLE", "COUPLE", "GROUP4"];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ pass?: string }>;
}) {
  const params = await searchParams;
  const requested = params.pass?.toUpperCase();
  const initialPass: PassType = VALID_PASSES.includes(requested as PassType)
    ? (requested as PassType)
    : "COUPLE";

  // If the database is unreachable we still want the form to render — the
  // order endpoint re-checks capacity anyway, so this is only a hint.
  let remaining: number | null = null;
  try {
    remaining = await seatsRemaining();
  } catch (err) {
    console.error("[register] Could not read remaining capacity:", err);
  }

  return (
    <div className="min-h-screen festival-haze">
      <header className="border-b border-night-600/50 bg-night-900/80 backdrop-blur-md">
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
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-rose-400">
            {EVENT.tagline}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-cream sm:text-5xl">
            Book your <span className="foil">pass</span>
          </h1>
          <Divider className="mx-auto mt-5 max-w-xs" />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-gold-600" />
              {EVENT.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5 text-gold-600" />
              {EVENT.timeLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <PinIcon className="h-3.5 w-3.5 text-gold-600" />
              {EVENT.venue}
            </span>
          </div>
        </div>

        <div className="mt-10">
          <RegisterForm initialPass={initialPass} seatsRemaining={remaining} />
        </div>
      </main>
      <WhatsAppButton message="Hi! I need help booking a pass for Smirk'N'Raas 2026." />
    </div>
  );
}
