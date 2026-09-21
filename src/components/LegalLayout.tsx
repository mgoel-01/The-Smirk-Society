import Link from "next/link";
import { EVENT } from "@/lib/event";
import { Divider } from "@/components/Decor";

/** Shared chrome for the terms / privacy / refunds pages. */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
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
          {title}
        </h1>
        <p className="mt-2.5 text-center text-xs text-muted">
          Last updated {updated}
        </p>
        <Divider className="mx-auto mt-6 max-w-xs" />

        <div className="prose-legal mt-10 space-y-7 text-sm leading-relaxed text-cream/80">
          {children}
        </div>

        <p className="mt-14 border-t border-night-600/60 pt-7 text-center text-xs text-muted">
          Questions about this page? See our{" "}
          <a href="/contact" className="text-gold-500 underline underline-offset-2">
            contact page
          </a>{" "}
          or reach us on Instagram at{" "}
          <a
            href={EVENT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 underline underline-offset-2"
          >
            @{EVENT.instagram}
          </a>
          .
        </p>
      </main>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-gold-400">
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
