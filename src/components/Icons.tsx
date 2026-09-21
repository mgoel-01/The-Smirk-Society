/**
 * Line icons for the highlight strip, drawn to echo the poster's thin-stroke
 * pictograms. All share a 24x24 box and inherit `currentColor`.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MicIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8.5 22h7" />
    </svg>
  );
}

export function SticksIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 20 20 4M20 20 4 4" />
      <circle cx="4" cy="20" r="1.5" />
      <circle cx="20" cy="4" r="1.5" />
      <circle cx="20" cy="20" r="1.5" />
      <circle cx="4" cy="4" r="1.5" />
    </svg>
  );
}

export function HeadphonesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="2.5" y="14" width="4.5" height="7" rx="2" />
      <rect x="17" y="14" width="4.5" height="7" rx="2" />
    </svg>
  );
}

export function FoodIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 10h18l-1.5-4.5h-15L3 10Z" />
      <path d="M5 10v9h14v-9M9 19v-5h6v5" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 8h14l-1 13H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function DholIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <ellipse cx="12" cy="7" rx="7" ry="2.6" />
      <path d="M5 7v10c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V7" />
      <path d="M6.5 9.5 17.5 14M17.5 9.5 6.5 14" />
    </svg>
  );
}

export function DecorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 2.5 21 12H3l9-9.5Z" />
      <path d="M5 12v9h14v-9M10 21v-5.5h4V21" />
    </svg>
  );
}

export function GamesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v6M8 9h8M9.5 21l2.5-8.5L14.5 21" />
    </svg>
  );
}

export function DanceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="7" cy="4" r="1.8" />
      <path d="M7 5.8v5M4.5 8h5M5 21l2-7 2 7" />
      <circle cx="17" cy="4" r="1.8" />
      <path d="M17 5.8v5M14.5 8h5M15 21l2-7 2 7" />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 8h3.5L8 5.5h8L17.5 8H21v12H3V8Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="m4.5 12.5 5 5 10-11" strokeWidth={1.8} />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 2.8 20 6v6c0 5-3.4 8.2-8 9.2C7.4 20.2 4 17 4 12V6l8-3.2Z" />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.6" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.72 2.62 4.16 3.67.58.25 1.03.4 1.39.52.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

/** Maps the string keys in `HIGHLIGHTS` to their component. */
export const HIGHLIGHT_ICONS = {
  mic: MicIcon,
  sticks: SticksIcon,
  headphones: HeadphonesIcon,
  food: FoodIcon,
  bag: BagIcon,
  dhol: DholIcon,
  decor: DecorIcon,
  games: GamesIcon,
  dance: DanceIcon,
  camera: CameraIcon,
} as const;
