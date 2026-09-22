import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/qr";
import { EVENT } from "@/lib/event";
import { PASSES, formatInr } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Downloadable pass — a single PNG a guest can keep in their photo gallery.
 *
 * This is what makes the site usable without confirmation emails: the guest
 * saves the image at checkout and no longer needs their browser history.
 * Portrait, phone-shaped, with the QR large enough to scan straight off a
 * screen at the gate.
 */

const GOLD = "#F5D9A8";
const GOLD_DIM = "#C9963F";
const CREAM = "#F3E3D0";
const MUTED = "#A98D80";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: { registration: { include: { tickets: true } } },
  });

  if (!ticket || ticket.registration.status !== "PAID") {
    return new Response("Not found", { status: 404 });
  }

  const registration = ticket.registration;
  const pass = PASSES[registration.passType];
  const qr = await qrDataUrl(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/ticket/${ticket.token}`,
  );

  const ordered = [...registration.tickets].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const index = ordered.findIndex((t) => t.id === ticket.id);

  const row = (label: string, value: string) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        fontSize: 26,
        marginTop: 14,
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: CREAM }}>{value}</span>
    </div>
  );

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#12040C",
          backgroundImage:
            "radial-gradient(circle at 15% 5%, rgba(194,24,91,0.30), transparent 55%), radial-gradient(circle at 85% 95%, rgba(224,184,114,0.18), transparent 55%)",
          padding: 40,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: 7,
            color: GOLD_DIM,
            textTransform: "uppercase",
          }}
        >
          {EVENT.host}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: 56,
            fontWeight: 700,
            color: GOLD,
          }}
        >
          {EVENT.name} {EVENT.year}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 6,
            fontSize: 20,
            letterSpacing: 3,
            color: "#D98BA8",
            textTransform: "uppercase",
          }}
        >
          {EVENT.ribbon} Dandiya Night
        </div>

        {/* QR on white — maximum contrast for scanning off a screen */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 30,
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 26,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={380} height={380} alt="" />
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#2A0A14",
            }}
          >
            {registration.bookingCode}
          </div>
        </div>

        {/* Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            marginTop: 30,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          {row("Name", registration.fullName)}
          {row(
            "Pass",
            ordered.length > 1
              ? `${pass.name} (${index + 1} of ${ordered.length})`
              : pass.name,
          )}
          {row(
            "Admits",
            `${ticket.seats} ${ticket.seats === 1 ? "person" : "people"}`,
          )}
          {row("Paid", formatInr(registration.amountPaise))}
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 1,
            backgroundColor: "rgba(224,184,114,0.35)",
            marginTop: 26,
          }}
        />

        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 28,
            color: CREAM,
          }}
        >
          {EVENT.dateLabel} · {EVENT.timeLabel}
        </div>
        <div
          style={{ display: "flex", marginTop: 8, fontSize: 24, color: MUTED }}
        >
          {EVENT.venue}, {EVENT.venueArea}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 20,
            color: GOLD_DIM,
          }}
        >
          Show this QR at the entrance · Scans once
        </div>
      </div>
    ),
    { width: 800, height: 1120 },
  );

  // Force a download rather than opening in a tab, and never let a shared
  // cache hold on to someone's pass.
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${registration.bookingCode}${
        ordered.length > 1 ? `-pass-${index + 1}` : ""
      }.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
