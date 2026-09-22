import Link from "next/link";
import { EVENT, HIGHLIGHTS, mapsUrl } from "@/lib/event";
import { PASS_LIST, formatInr } from "@/lib/pricing";
import { Bokeh, Divider, StringLights } from "@/components/Decor";
import { Countdown } from "@/components/Countdown";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HIGHLIGHT_ICONS,
  InstagramIcon,
  PinIcon,
  ShieldIcon,
} from "@/components/Icons";

/** Structured data so the event surfaces properly in Google search results. */
function EventJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${EVENT.name} ${EVENT.year}`,
    description: EVENT.tagline,
    startDate: EVENT.startsAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: EVENT.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: EVENT.venueArea,
        addressLocality: "Ghaziabad",
        addressRegion: "Uttar Pradesh",
        addressCountry: "IN",
      },
    },
    organizer: { "@type": "Organization", name: EVENT.host, url: EVENT.instagramUrl },
    offers: PASS_LIST.map((pass) => ({
      "@type": "Offer",
      name: pass.name,
      price: (pass.pricePaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-night-600/50 bg-night-900/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="group flex flex-col leading-none">
          <span className="text-[9px] uppercase tracking-[0.28em] text-muted">
            {EVENT.host}
          </span>
          <span className="font-script text-xl text-gold-400 transition-colors group-hover:text-gold-300">
            {EVENT.name}
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-5">
          <a
            href="#passes"
            className="hidden px-2 text-sm text-cream/75 transition-colors hover:text-gold-400 sm:block"
          >
            Passes
          </a>
          <a
            href="#details"
            className="hidden px-2 text-sm text-cream/75 transition-colors hover:text-gold-400 sm:block"
          >
            Details
          </a>
          <a
            href="#faq"
            className="hidden px-2 text-sm text-cream/75 transition-colors hover:text-gold-400 sm:block"
          >
            FAQ
          </a>
          <Link
            href="/register"
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5 hover:bg-rose-400"
          >
            Book passes
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden festival-haze">
      <StringLights />
      <Bokeh />

      <div className="relative mx-auto max-w-4xl px-5 pb-20 pt-24 text-center sm:pt-28">
        <p className="animate-rise text-[10px] uppercase tracking-[0.42em] text-gold-500 sm:text-xs">
          {EVENT.host}
        </p>
        <p
          className="mt-2 animate-rise text-[9px] uppercase tracking-[0.5em] text-muted"
          style={{ animationDelay: "60ms" }}
        >
          Presents
        </p>

        <div
          className="mt-7 flex animate-rise justify-center"
          style={{ animationDelay: "120ms" }}
        >
          <span className="rounded-full bg-gradient-to-r from-wine-600 via-rose-600 to-wine-600 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300 shadow-lg shadow-rose-900/40 sm:text-xs">
            {EVENT.ribbon}
          </span>
        </div>

        <h1 className="mt-5">
          <span
            className="foil block animate-rise font-display text-[3.4rem] font-bold leading-[0.92] tracking-tight sm:text-8xl lg:text-9xl"
            style={{ animationDelay: "180ms" }}
          >
            DANDIYA
          </span>
          <span
            className="mt-1 block animate-rise font-display text-3xl font-medium tracking-[0.34em] text-cream sm:text-5xl"
            style={{ animationDelay: "240ms" }}
          >
            NIGHT
          </span>
          <span
            className="rose-foil mt-3 block animate-rise font-script text-5xl leading-tight sm:text-7xl lg:text-8xl"
            style={{ animationDelay: "300ms" }}
          >
            {EVENT.name}
          </span>
        </h1>

        <p
          className="mt-3 animate-rise font-display text-2xl tracking-[0.3em] text-gold-500 sm:text-3xl"
          style={{ animationDelay: "360ms" }}
        >
          {EVENT.year}
        </p>

        <Divider className="mx-auto mt-7 max-w-xs animate-rise" />

        <p
          className="mt-6 animate-rise text-[11px] uppercase tracking-[0.2em] text-cream/80 sm:text-sm"
          style={{ animationDelay: "420ms" }}
        >
          Dance <span className="text-rose-400">&#9670;</span> Music{" "}
          <span className="text-rose-400">&#9670;</span> Food{" "}
          <span className="text-rose-400">&#9670;</span> Shopping
        </p>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-muted sm:text-sm">
          and so much more!
        </p>

        {/* When / where / time — the three facts people scan for first. */}
        <dl
          className="mx-auto mt-10 grid max-w-2xl animate-rise gap-3 sm:grid-cols-3"
          style={{ animationDelay: "480ms" }}
        >
          {[
            { Icon: CalendarIcon, term: "Date", value: EVENT.dateLabel, sub: EVENT.dayLabel },
            { Icon: PinIcon, term: "Venue", value: EVENT.venue, sub: EVENT.venueArea },
            { Icon: ClockIcon, term: "Time", value: EVENT.timeLabel, sub: "Till late" },
          ].map(({ Icon, term, value, sub }) => (
            <div
              key={term}
              className="card-glow rounded-2xl border border-night-500/60 bg-night-800/60 px-4 py-5 backdrop-blur-sm"
            >
              <Icon className="mx-auto h-6 w-6 text-gold-500" />
              <dt className="sr-only">{term}</dt>
              <dd className="mt-2.5 font-display text-lg font-semibold leading-snug text-cream">
                {value}
              </dd>
              <dd className="mt-0.5 text-xs text-muted">{sub}</dd>
            </div>
          ))}
        </dl>

        <div
          className="mt-10 animate-rise"
          style={{ animationDelay: "540ms" }}
        >
          <p className="mb-3.5 text-[10px] uppercase tracking-[0.3em] text-muted">
            The night begins in
          </p>
          <Countdown />
        </div>

        <div
          className="mt-10 flex animate-rise flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "600ms" }}
        >
          <Link
            href="/register"
            className="w-full max-w-xs rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-9 py-4 text-center text-base font-semibold text-white shadow-xl shadow-rose-900/40 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-rose-800/50 sm:w-auto"
          >
            Book your pass
          </Link>
          <a
            href="#passes"
            className="w-full max-w-xs rounded-full border border-gold-600/45 px-9 py-4 text-center text-base font-medium text-gold-400 transition-all hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-500/8 sm:w-auto"
          >
            See pricing
          </a>
        </div>

        <p
          className="mt-5 flex animate-rise items-center justify-center gap-1.5 text-xs text-muted"
          style={{ animationDelay: "660ms" }}
        >
          <ShieldIcon className="h-3.5 w-3.5 text-gold-600" />
          Secure payment via Razorpay · Instant QR ticket on email
        </p>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [
    "Live Band", "Dhol", "DJ Night", "Food Stalls", "Shopping",
    "Free Dandiya Sticks", "Fun Games", "Photographer", "Thematic Decor",
  ];
  return (
    <div className="overflow-hidden border-y border-night-600/60 bg-night-800/50 py-3.5">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.2em] text-gold-500/85 sm:text-xs"
          >
            {item}
            <span className="text-rose-500/60" aria-hidden="true">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Highlights() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-20">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-rose-400">
          What&rsquo;s inside
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-cream sm:text-5xl">
          One night, <span className="foil">everything</span>
        </h2>
        <Divider className="mx-auto mt-5 max-w-xs" />
      </div>

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {HIGHLIGHTS.map((item) => {
          const Icon = HIGHLIGHT_ICONS[item.icon];
          return (
            <li
              key={item.label}
              className="group rounded-2xl border border-night-600/70 bg-night-800/45 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold-600/45 hover:bg-night-700/55"
            >
              <Icon className="mx-auto h-7 w-7 text-gold-500 transition-colors group-hover:text-gold-400" />
              <h3 className="mt-3.5 text-sm font-semibold leading-snug text-cream">
                {item.label}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {item.note}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Passes() {
  return (
    <section id="passes" className="relative scroll-mt-20 festival-haze">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-rose-400">
            Entry passes
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-cream sm:text-5xl">
            Pick your <span className="foil">pass</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            The bigger the group, the less each person pays. Every pass includes
            dandiya sticks, entry to all stalls and the open dance floor.
          </p>
          <Divider className="mx-auto mt-5 max-w-xs" />
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PASS_LIST.map((pass) => {
            const featured = pass.id === "COUPLE";
            return (
              <div
                key={pass.id}
                className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                  featured
                    ? "border-gold-600/55 bg-gradient-to-b from-night-700/90 to-night-800/70 card-glow lg:-my-3 lg:py-10"
                    : "border-night-500/70 bg-night-800/55"
                }`}
              >
                {pass.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg shadow-rose-900/40">
                    {pass.badge}
                  </span>
                )}

                <h3 className="font-display text-2xl font-semibold text-gold-400">
                  {pass.name}
                </h3>
                <p className="mt-1 text-xs text-muted">{pass.blurb}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold text-cream">
                    {formatInr(pass.pricePaise)}
                  </span>
                  <span className="text-sm text-muted">/-</span>
                </div>

                <p className="mt-1.5 text-sm text-rose-300">
                  {pass.seats === 1
                    ? "Per person"
                    : `${formatInr(pass.perPersonPaise)} per person · admits ${pass.seats}`}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5 border-t border-night-500/60 pt-6 text-sm text-cream/80">
                  {[
                    `Entry for ${pass.seats} ${pass.seats === 1 ? "person" : "people"}`,
                    "Free dandiya sticks",
                    "All food & shopping stalls",
                    "Live band, dhol & DJ",
                    "Open dance floor + games",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?pass=${pass.id}`}
                  className={`mt-7 rounded-full px-6 py-3.5 text-center text-sm font-semibold transition-all ${
                    featured
                      ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-900/40 hover:shadow-xl"
                      : "border border-gold-600/45 text-gold-400 hover:border-gold-500 hover:bg-gold-500/8"
                  }`}
                >
                  Book {pass.name}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          All prices are inclusive. Passes are limited and sold on a
          first-come basis.
        </p>
      </div>
    </section>
  );
}

function Details() {
  return (
    <section id="details" className="scroll-mt-20 border-t border-night-600/50">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-rose-400">
              The details
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-cream sm:text-5xl">
              When &amp; <span className="foil">where</span>
            </h2>

            <dl className="mt-8 space-y-5">
              {[
                {
                  Icon: CalendarIcon,
                  term: "Date",
                  value: `${EVENT.dayLabel}, ${EVENT.dateLabel}`,
                },
                { Icon: ClockIcon, term: "Doors open", value: EVENT.timeLabel },
                {
                  Icon: PinIcon,
                  term: "Venue",
                  value: `${EVENT.venue}, ${EVENT.venueArea}`,
                },
              ].map(({ Icon, term, value }) => (
                <div key={term} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-600/30 bg-night-800/70">
                    <Icon className="h-5 w-5 text-gold-500" />
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-muted">
                      {term}
                    </dt>
                    <dd className="mt-1 font-display text-xl text-cream">
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-600/45 px-6 py-3 text-sm font-medium text-gold-400 transition-all hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-500/8"
            >
              <PinIcon className="h-4 w-4" />
              Open in Google Maps
            </a>
          </div>

          <div className="rounded-3xl border border-night-500/70 bg-night-800/55 p-7 sm:p-9">
            <h3 className="font-display text-2xl font-semibold text-gold-400">
              Good to know
            </h3>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-cream/80">
              {[
                ["Dress code", "Traditional or ethnic wear — chaniya choli, kurta, whatever makes you want to twirl."],
                ["Dandiya sticks", "Provided free at the entrance. Bring your own if you have a favourite pair."],
                ["Entry", "Show the QR code from your email at the gate. Each pass scans once."],
                ["Arrive early", "Gates open at 6 PM. The first garba round starts soon after — come early for the best floor."],
                ["Parking", "On-site parking is available at Chancellor Club."],
              ].map(([term, detail]) => (
                <li key={term} className="border-l-2 border-rose-600/45 pl-4">
                  <span className="font-semibold text-cream">{term}.</span>{" "}
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: "How do I get my ticket after paying?",
      a: "The moment your payment succeeds your pass appears on screen with a QR code. Tap Download your pass to save it to your phone — that image is your entry, so you do not need to keep the page open.",
    },
    {
      q: "I closed the page and lost my pass. What now?",
      a: "Go to Find my pass and enter the email address and mobile number you booked with. Your passes come straight back up, ready to view or download again.",
    },
    {
      q: "What if I book a couple or group pass?",
      a: "One QR code covers the whole pass. A couple pass admits two people together, a group pass admits four. Everyone should arrive at the gate together.",
    },
    {
      q: "Is my payment secure?",
      a: "Yes. Payments are handled entirely by Razorpay, an RBI-authorised payment gateway. We never see or store your card, UPI or banking details — only your name, email and phone, so we can send your ticket.",
    },
    {
      q: "Can I get a refund or transfer my pass?",
      a: "Passes are non-refundable, but they are transferable. If you cannot make it, forward your QR to whoever takes your place — just remember each pass scans only once.",
    },

    {
      q: "Are children allowed?",
      a: "Absolutely — this is a family event. Children under 5 enter free with a paying adult; anyone older needs their own pass.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-20 border-t border-night-600/50">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-rose-400">
            Questions
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-cream sm:text-5xl">
            Before you <span className="foil">book</span>
          </h2>
          <Divider className="mx-auto mt-5 max-w-xs" />
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-night-600/70 bg-night-800/45 transition-colors open:border-gold-600/35 open:bg-night-800/70"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium text-cream marker:content-none">
                {faq.q}
                <span
                  className="shrink-0 text-xl leading-none text-gold-500 transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden festival-haze">
      <Bokeh />
      <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
        <h2 className="font-script text-5xl text-gold-400 sm:text-6xl">
          See you there!
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-cream/75">
          {EVENT.tagline} is filling up fast. Grab your pass, round up your
          people, and we will handle the rest.
        </p>
        <Link
          href="/register"
          className="mt-9 inline-block rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-11 py-4 text-base font-semibold text-white shadow-xl shadow-rose-900/40 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
        >
          Book your pass now
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-night-600/60 bg-night-950">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted">
              {EVENT.host}
            </p>
            <p className="font-script text-2xl text-gold-400">
              {EVENT.name} {EVENT.year}
            </p>
            <p className="mt-1 text-xs text-muted">
              {EVENT.dateLabel} · {EVENT.venue}, {EVENT.venueArea}
            </p>
          </div>

          <a
            href={EVENT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full border border-night-500 px-5 py-2.5 text-sm text-cream/85 transition-all hover:-translate-y-0.5 hover:border-rose-500/60 hover:text-rose-300"
          >
            <InstagramIcon className="h-4 w-4" />
            @{EVENT.instagram}
          </a>
        </div>

        <div className="mt-9 flex flex-col items-center gap-3 border-t border-night-600/60 pt-7 text-xs text-muted sm:flex-row sm:justify-between">
          <p>
            &copy; {EVENT.year} {EVENT.host}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/find" className="transition-colors hover:text-gold-400">
              Find my pass
            </Link>
            <Link href="/contact" className="transition-colors hover:text-gold-400">
              Contact
            </Link>
            <Link href="/terms" className="transition-colors hover:text-gold-400">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-gold-400">
              Privacy
            </Link>
            <Link href="/refunds" className="transition-colors hover:text-gold-400">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <EventJsonLd />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Highlights />
        <Passes />
        <Details />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
