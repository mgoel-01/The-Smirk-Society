import { ImageResponse } from "next/og";
import { EVENT } from "@/lib/event";
import { PASSES, formatInr } from "@/lib/pricing";

/**
 * The card people see when the link is shared on WhatsApp, Instagram or
 * anywhere else. Generated at build time into a static PNG.
 *
 * Deliberately no web fonts: fetching one would make the build depend on
 * Google Fonts being reachable, and at thumbnail size a heavy sans reads
 * better than a delicate display serif anyway.
 *
 * Satori (which renders this) supports flexbox only — no grid, no shorthand
 * `background`, and every element with more than one child needs an explicit
 * `display: flex`.
 */
export const alt = `${EVENT.name} ${EVENT.year} — ${EVENT.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#F5D9A8";
const GOLD_DIM = "#C9963F";
const ROSE = "#E0447E";
const CREAM = "#F3E3D0";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#12040C",
          backgroundImage:
            "radial-gradient(circle at 12% 8%, rgba(194,24,91,0.34), transparent 55%), radial-gradient(circle at 88% 14%, rgba(224,184,114,0.22), transparent 55%), radial-gradient(circle at 50% 108%, rgba(109,22,56,0.55), transparent 62%)",
        }}
      >
        {/* Gold hairline frame */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            right: 26,
            bottom: 26,
            border: `1px solid rgba(224,184,114,0.32)`,
            borderRadius: 18,
            display: "flex",
          }}
        />

        {/* Presenter */}
        <div
          style={{
            display: "flex",
            fontSize: 21,
            letterSpacing: 9,
            color: GOLD_DIM,
            textTransform: "uppercase",
          }}
        >
          {EVENT.host}
        </div>

        {/* Ribbon */}
        <div
          style={{
            display: "flex",
            marginTop: 26,
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 11,
            paddingBottom: 11,
            borderRadius: 999,
            backgroundColor: "#A3144C",
            color: "#FBECCD",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {EVENT.ribbon}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 124,
            fontWeight: 800,
            letterSpacing: -2,
            color: GOLD,
            lineHeight: 1,
          }}
        >
          DANDIYA NIGHT
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 62,
            fontWeight: 700,
            color: ROSE,
            letterSpacing: 1,
          }}
        >
          {EVENT.name} {EVENT.year}
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            marginTop: 30,
            width: 320,
            height: 1,
            backgroundColor: "rgba(224,184,114,0.45)",
          }}
        />

        {/* When / where */}
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: 31,
            color: CREAM,
            letterSpacing: 1,
          }}
        >
          {EVENT.dateLabel}
          <span style={{ color: GOLD_DIM, marginLeft: 16, marginRight: 16 }}>
            ·
          </span>
          {EVENT.timeLabel}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 27,
            color: "#A98D80",
          }}
        >
          {EVENT.venue}, {EVENT.venueArea}
        </div>

        {/* Price hook */}
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 25,
            color: GOLD,
            letterSpacing: 2,
          }}
        >
          Passes from {formatInr(PASSES.GROUP4.perPersonPaise)} per person
        </div>
      </div>
    ),
    size,
  );
}
