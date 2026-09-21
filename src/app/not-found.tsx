import Link from "next/link";
import { EVENT } from "@/lib/event";
import { Divider } from "@/components/Decor";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 text-center festival-haze">
      <div className="max-w-md">
        <p className="font-script text-6xl text-gold-400">Oops</p>
        <Divider className="mx-auto mt-5 max-w-[10rem]" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-cream">
          We couldn&rsquo;t find that page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          If you were opening a ticket link, it may have expired, been mistyped,
          or the booking may not have completed. Message us on Instagram with
          your booking ID and we will sort it out.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="w-full max-w-[200px] rounded-full bg-rose-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
          >
            Back to the event
          </Link>
          <a
            href={EVENT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[200px] rounded-full border border-gold-600/45 px-7 py-3 text-sm text-gold-400 transition-colors hover:bg-gold-500/8"
          >
            @{EVENT.instagram}
          </a>
        </div>
      </div>
    </div>
  );
}
