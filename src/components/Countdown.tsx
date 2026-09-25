"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EVENT } from "@/lib/event";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remainingFrom(target: number): Remaining | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

/**
 * One digit in its own little window. Keying the span on the digit makes
 * React swap the element whenever the value changes, which is what gives
 * `AnimatePresence` an old digit to roll out and a new one to roll in — the
 * clock reads as ticking rather than as text being rewritten.
 */
function RollingDigit({ digit, still }: { digit: string; still: boolean }) {
  if (still) return <span>{digit}</span>;

  return (
    <span className="relative inline-block h-[1.15em] w-[0.62em] overflow-hidden align-bottom">
      <AnimatePresence initial={false}>
        <motion.span
          key={digit}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: "-110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Live countdown to the first dandiya stick.
 *
 * Renders nothing until after mount: the server has no idea what "now" is on
 * the visitor's device, so rendering a time on both sides would guarantee a
 * hydration mismatch.
 */
export function Countdown() {
  const target = EVENT.startsAt.getTime();
  const reduced = useReducedMotion();
  const [left, setLeft] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLeft(remainingFrom(target));
    const id = setInterval(() => setLeft(remainingFrom(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) {
    // Reserve the same vertical space so the hero does not jump on hydration.
    return <div className="h-[86px]" aria-hidden="true" />;
  }

  if (!left) {
    return (
      <p className="font-display text-2xl text-gold-400">
        The night is here — see you on the floor!
      </p>
    );
  }

  const units: [string, number][] = [
    ["Days", left.days],
    ["Hours", left.hours],
    ["Minutes", left.minutes],
    ["Seconds", left.seconds],
  ];

  return (
    <div
      className="flex items-center justify-center gap-2.5 sm:gap-4"
      role="timer"
      aria-label={`${left.days} days until the event`}
    >
      {units.map(([label, value], index) => (
        <div key={label} className="flex items-center gap-2.5 sm:gap-4">
          <div className="min-w-[62px] rounded-xl border border-night-500/70 bg-night-800/70 px-3 py-2.5 text-center backdrop-blur-sm sm:min-w-[76px]">
            <div className="flex justify-center font-display text-2xl font-semibold tabular-nums text-gold-400 sm:text-3xl">
              {String(value)
                .padStart(2, "0")
                .split("")
                .map((digit, position) => (
                  <RollingDigit
                    key={`${label}-${position}`}
                    digit={digit}
                    still={Boolean(reduced)}
                  />
                ))}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted sm:text-[10px]">
              {label}
            </div>
          </div>
          {index < units.length - 1 && (
            <span
              className="animate-pulse font-display text-xl text-gold-600/50"
              aria-hidden="true"
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
