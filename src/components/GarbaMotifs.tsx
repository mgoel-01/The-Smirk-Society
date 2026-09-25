/**
 * Motifs drawn from the festival itself, rather than from a component
 * catalogue: the rangoli laid at the door, the ring of dancers, the dandiya
 * beat, the diya and the peacock feather. All of it is decorative, so every
 * piece is `aria-hidden` and none of it carries meaning a reader would miss.
 *
 * Everything here is plain SVG driven by CSS keyframes declared in
 * `globals.css`, which keeps these Server Components — no client bundle — and
 * lets the `prefers-reduced-motion` block in that file switch the lot off.
 */

const TAU = Math.PI * 2;

/* -------------------------------------------------------------------------
   Rangoli — concentric petal rings, counter-rotating.
------------------------------------------------------------------------- */

const OUTER_PETALS = Array.from({ length: 24 }, (_, i) => i * (360 / 24));
const MID_PETALS = Array.from({ length: 16 }, (_, i) => i * (360 / 16));
const INNER_DOTS = Array.from({ length: 12 }, (_, i) => i * (360 / 12));

/**
 * The chalk-and-colour mandala drawn at the entrance. Sits far behind the
 * content at low opacity; the rings turn in opposite directions so the
 * pattern never settles into one readable shape.
 */
export function Rangoli({
  className = "",
  size = 520,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <g className="animate-spin-slow origin-center" stroke="currentColor" strokeWidth="0.5">
        {OUTER_PETALS.map((angle) => (
          <path
            key={angle}
            d="M100 8 C111 26 111 40 100 54 C89 40 89 26 100 8 Z"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="80" strokeDasharray="1.5 4" opacity="0.7" />
      </g>

      <g
        className="animate-spin-slow-reverse origin-center"
        stroke="currentColor"
        strokeWidth="0.6"
      >
        {MID_PETALS.map((angle) => (
          <path
            key={angle}
            d="M100 42 C107 54 107 62 100 72 C93 62 93 54 100 42 Z"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="58" strokeDasharray="2 6" opacity="0.6" />
      </g>

      <g className="animate-spin-slow origin-center" fill="currentColor">
        {INNER_DOTS.map((angle) => (
          <circle
            key={angle}
            cx="100"
            cy="64"
            r="1.4"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
      </g>

      {/* The diamond from the poster, holding the centre still. */}
      <g stroke="currentColor" strokeWidth="0.8">
        <path d="M100 86 114 100 100 114 86 100Z" />
        <circle cx="100" cy="100" r="3.4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Diya — the oil lamp, with a flame that will not sit still.
------------------------------------------------------------------------- */

/** Lamp and flame in local coordinates, centred on its own origin. */
function DiyaGlyph() {
  return (
    <g>
      <ellipse cx="0" cy="12" rx="13" ry="3.4" fill="currentColor" opacity="0.18" />
      <path
        d="M-11 6 Q0 15 11 6 Q11 10 0 12 Q-11 10 -11 6 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <g className="animate-flicker origin-bottom">
        <path d="M0 -12 C4.6 -5.5 4 -1 0 3 C-4 -1 -4.6 -5.5 0 -12 Z" fill="currentColor" />
      </g>
      <circle
        cx="0"
        cy="-4"
        r="11"
        fill="currentColor"
        opacity="0.1"
        className="animate-pulse-glow origin-center"
      />
    </g>
  );
}

/** A standalone diya, for section headings and the final call to action. */
export function Diya({ className = "", size = 44 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="-20 -20 40 40"
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <DiyaGlyph />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Garba circle — dancers ringed around a diya, bobbing in sequence.
------------------------------------------------------------------------- */

const DANCER_COUNT = 12;
const RING_RADIUS = 66;

/**
 * Positions are computed once at module load, never from `Math.random` — the
 * server and the client must emit identical markup or hydration complains,
 * the same constraint `Decor.tsx` is written around.
 */
const DANCERS = Array.from({ length: DANCER_COUNT }, (_, i) => {
  const angle = (i / DANCER_COUNT) * TAU - Math.PI / 2;
  return {
    i,
    x: 100 + Math.cos(angle) * RING_RADIUS,
    y: 100 + Math.sin(angle) * RING_RADIUS,
    // A wave that travels once around the ring per cycle, so the bob reads as
    // the beat moving through the circle, not twelve people jumping at once.
    delay: (i / DANCER_COUNT) * 2.4,
  };
});

/** One stylised dancer: raised arms, a pair of sticks, a flared lehenga. */
function Dancer() {
  return (
    <g fill="currentColor">
      <circle cx="0" cy="-19" r="3" />
      <path d="M0 -15.5 L-2 -6 L-7.5 7 L7.5 7 L2 -6 Z" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M-1 -13 L-7.5 -19.5" />
        <path d="M1 -13 L7.5 -19.5" />
      </g>
      {/* Dandiya, angled out of each hand. */}
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" fill="none">
        <path d="M-7.5 -19.5 L-12 -25.5" />
        <path d="M7.5 -19.5 L12 -25.5" />
      </g>
    </g>
  );
}

/**
 * The ring itself. Rather than spinning the whole group — which would leave
 * the dancers at the bottom upside down — the figures stay upright and the
 * beat travels around them, while dashed rings turn behind.
 */
export function GarbaCircle({
  className = "",
  size = 340,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <circle
        cx="100"
        cy="100"
        r={RING_RADIUS + 16}
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="3 7"
        opacity="0.45"
        className="animate-spin-slow origin-center"
      />
      <circle
        cx="100"
        cy="100"
        r={RING_RADIUS - 22}
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="1.5 5"
        opacity="0.3"
        className="animate-spin-slow-reverse origin-center"
      />

      {DANCERS.map((dancer) => (
        <g key={dancer.i} transform={`translate(${dancer.x} ${dancer.y})`}>
          <g className="animate-bob" style={{ animationDelay: `${dancer.delay}s` }}>
            <Dancer />
          </g>
        </g>
      ))}

      {/* The lamp the circle turns around. */}
      <g transform="translate(100 104)">
        <DiyaGlyph />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Dandiya — two sticks keeping the beat.
------------------------------------------------------------------------- */

/**
 * A pair of sticks striking on the beat, with a spark on contact. Next to a
 * heading it does the job a spinner does elsewhere: it says the page is live.
 */
export function DandiyaTap({
  className = "",
  size = 56,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <g
        className="animate-tap-left"
        style={{ transformOrigin: "10px 52px" }}
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      >
        <path d="M10 52 L27 27" />
        <path d="M27 27 L29 24" strokeWidth="4.4" opacity="0.75" />
      </g>
      <g
        className="animate-tap-right"
        style={{ transformOrigin: "50px 52px" }}
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      >
        <path d="M50 52 L33 27" />
        <path d="M33 27 L31 24" strokeWidth="4.4" opacity="0.75" />
      </g>
      <g
        className="animate-spark"
        style={{ transformOrigin: "30px 20px" }}
        fill="currentColor"
      >
        <path d="M30 13 L31.6 20 L30 27 L28.4 20 Z" />
        <path d="M21 20 L28 21.6 L35 20 L28 18.4 Z" opacity="0.7" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Peacock feather — the other thing hanging off every dandiya stall.
------------------------------------------------------------------------- */

const BARBS = Array.from({ length: 16 }, (_, i) => ({
  i,
  y: 34 + i * 4.6,
  spread: 4 + i * 0.9,
}));

/** A feather swaying from its quill, for the corners of quieter sections. */
export function PeacockFeather({
  className = "",
  width = 60,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 150"
      width={width}
      height={width * 2.5}
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <g className="animate-sway" style={{ transformOrigin: "50% 0%" }}>
        <path d="M30 0 L30 108" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        {BARBS.map((barb) => (
          <g
            key={barb.i}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity={0.28 + barb.i * 0.02}
          >
            <path d={`M30 ${barb.y} L${30 - barb.spread} ${barb.y + 5}`} />
            <path d={`M30 ${barb.y} L${30 + barb.spread} ${barb.y + 5}`} />
          </g>
        ))}
        <ellipse
          cx="30"
          cy="112"
          rx="15"
          ry="20"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.5"
        />
        <ellipse cx="30" cy="114" rx="8.5" ry="11" fill="currentColor" opacity="0.2" />
        <ellipse cx="30" cy="115" rx="4.5" ry="6" fill="currentColor" opacity="0.45" />
      </g>
    </svg>
  );
}
