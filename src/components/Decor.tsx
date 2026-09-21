/**
 * Purely decorative background pieces: the hanging string lights and the
 * bokeh haze from the poster. Deliberately deterministic — no Math.random at
 * render time, which would produce different markup on the server and the
 * client and trip a hydration mismatch.
 */

const BULBS = [
  { x: 4, delay: 0 }, { x: 11, delay: 0.7 }, { x: 18, delay: 1.4 },
  { x: 25, delay: 0.3 }, { x: 32, delay: 2.1 }, { x: 39, delay: 1.1 },
  { x: 46, delay: 0.5 }, { x: 53, delay: 1.8 }, { x: 60, delay: 0.9 },
  { x: 67, delay: 2.4 }, { x: 74, delay: 0.2 }, { x: 81, delay: 1.6 },
  { x: 88, delay: 1.0 }, { x: 95, delay: 2.2 },
];

/** Two sagging catenary strands of warm bulbs across the top of the hero. */
export function StringLights() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
    >
      <svg
        className="absolute inset-x-0 top-0 h-40 w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0 3 Q 25 17 50 6 T 100 4"
          fill="none"
          stroke="#5a3a22"
          strokeWidth="0.35"
        />
        <path
          d="M0 10 Q 30 26 60 13 T 100 11"
          fill="none"
          stroke="#5a3a22"
          strokeWidth="0.3"
          opacity="0.7"
        />
      </svg>

      {BULBS.map((bulb) => (
        <span
          key={bulb.x}
          className="absolute top-0 block"
          style={{ left: `${bulb.x}%` }}
        >
          <span
            className="block h-2 w-2 rounded-full bg-gold-400 animate-twinkle"
            style={{
              animationDelay: `${bulb.delay}s`,
              marginTop: `${6 + Math.sin(bulb.x / 9) * 10}px`,
              boxShadow:
                "0 0 8px 2px rgb(245 217 168 / 0.75), 0 0 20px 6px rgb(224 184 114 / 0.35)",
            }}
          />
        </span>
      ))}
    </div>
  );
}

/** Soft floating orbs — the out-of-focus festival lights behind the content. */
export function Bokeh() {
  const orbs = [
    { x: 8, y: 22, size: 190, hue: "rgb(194 24 91 / 0.16)", delay: 0 },
    { x: 78, y: 12, size: 240, hue: "rgb(224 184 114 / 0.12)", delay: 1.6 },
    { x: 62, y: 68, size: 200, hue: "rgb(163 20 76 / 0.16)", delay: 3.2 },
    { x: 18, y: 76, size: 160, hue: "rgb(245 217 168 / 0.10)", delay: 2.4 },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb) => (
        <span
          key={`${orb.x}-${orb.y}`}
          className="absolute rounded-full blur-3xl animate-float"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: orb.hue,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** The poster's diamond-and-rule divider. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`gold-rule ${className}`} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 0.8 13.2 7 7 13.2 0.8 7 7 0.8Z" stroke="currentColor" strokeWidth="1" />
        <circle cx="7" cy="7" r="1.6" fill="currentColor" />
      </svg>
    </div>
  );
}
