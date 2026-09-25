import { cn } from "@/lib/cn";

/**
 * A row that scrolls forever. The children are rendered `repeat` times and
 * the track is translated by exactly one copy's width, so the seam never
 * shows. No JavaScript — this is a pure CSS animation and stays a Server
 * Component, which matters on a page that ships almost no client bundle.
 */
export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:38s] [--gap:1.75rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, index) => (
        <div
          key={index}
          aria-hidden={index > 0}
          className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
            "animate-marquee flex-row": !vertical,
            "animate-marquee-vertical flex-col": vertical,
            "group-hover:[animation-play-state:paused]": pauseOnHover,
            "[animation-direction:reverse]": reverse,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
