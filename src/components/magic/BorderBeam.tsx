import { cn } from "@/lib/cn";

type BorderBeamProps = {
  className?: string;
  /** Length of the travelling highlight, in pixels. */
  size?: number;
  duration?: number;
  delay?: number;
  /** Corner radius of the path the beam runs. Match the card's own radius. */
  radius?: number;
  colorFrom?: string;
  colorTo?: string;
  /** Run the beam anticlockwise. Two beams in opposition read well together. */
  reverse?: boolean;
};

/**
 * A gold highlight that travels the border of its container, like the foil
 * sweep on the poster but running a card's edge.
 *
 * The beam rides an `offset-path` shaped like the container, which keeps it
 * on the border without a mask and without measuring anything — so this stays
 * a Server Component. The parent needs `relative`.
 */
export function BorderBeam({
  className,
  size = 62,
  duration = 6,
  delay = 0,
  radius = 24,
  colorFrom = "#c9963f",
  colorTo = "#fff6e2",
  reverse = false,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <div
        className={cn(
          "border-beam absolute aspect-square bg-gradient-to-l from-[var(--beam-from)] via-[var(--beam-to)] to-transparent blur-[1px]",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${radius}px)`,
            animationDirection: reverse ? "reverse" : "normal",
            "--beam-duration": `${duration}s`,
            "--beam-delay": `${-delay}s`,
            "--beam-from": colorFrom,
            "--beam-to": colorTo,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
