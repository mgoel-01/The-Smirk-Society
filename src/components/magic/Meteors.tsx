"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type MeteorStyle = React.CSSProperties & { "--angle": string };

/**
 * Gold embers drifting down across the hero, as if the diyas were throwing
 * sparks. Positions are randomised in an effect rather than at render, so the
 * server and the first client pass agree and hydration stays quiet — the same
 * rule the string lights in `Decor.tsx` follow.
 */
export function Meteors({
  number = 16,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 3.2,
  maxDuration = 9,
  angle = 215,
  className,
}: {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}) {
  const [styles, setStyles] = useState<MeteorStyle[]>([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: number }, () => ({
        "--angle": `${-angle}deg`,
        top: "-6%",
        left: `${Math.floor(Math.random() * 100)}%`,
        animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
        animationDuration: `${
          Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)
        }s`,
      })),
    );
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {styles.map((style, index) => (
        <span
          key={index}
          style={style}
          className={cn(
            "animate-meteor pointer-events-none absolute size-[3px] rotate-[var(--angle)] rounded-full bg-gold-400 shadow-[0_0_6px_2px_rgb(245_217_168/0.35)]",
            className,
          )}
        >
          {/* The trailing tail, drawn as a tapering gradient behind the head. */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[52px] -translate-y-1/2 bg-gradient-to-r from-gold-500/70 to-transparent" />
        </span>
      ))}
    </div>
  );
}
