import { cn } from "@/lib/cn";

/**
 * A gold hairline across the top of the page showing how far down it you are.
 * Driven by `animation-timeline: scroll()`, so the browser advances it off the
 * scroll position on the compositor: no scroll listener, no React state, and
 * no client bundle. Browsers without scroll-driven animations keep it at zero
 * width, where it reads as absent rather than broken.
 *
 * Sits above the sticky nav, which is `z-50`.
 */
export function ScrollProgress({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "scroll-progress fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-rose-600 via-gold-400 to-rose-600",
        className,
      )}
    />
  );
}
