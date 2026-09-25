import { cn } from "@/lib/cn";

/**
 * A narrow band of light that sweeps across muted text, leaving it legible at
 * rest. Drawn with a background clipped to the glyphs, so it costs one
 * compositor-only animation and no JavaScript.
 */
export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 110,
}: {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}) {
  return (
    <span
      style={{ "--shiny-width": `${shimmerWidth}px` } as React.CSSProperties}
      className={cn(
        "mx-auto max-w-md text-gold-500/70",
        "animate-shiny-text bg-clip-text bg-no-repeat [background-size:var(--shiny-width)_100%]",
        "bg-gradient-to-r from-transparent via-gold-300 via-50% to-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
