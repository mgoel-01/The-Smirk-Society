import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { PASSES } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Wraps every CSV field. Prefixing a lone formula character defuses CSV
 * injection — without it, a name like `=HYPERLINK(...)` becomes live code the
 * moment the export is opened in Excel.
 */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await verifyAdminSession(
    (await cookies()).get(ADMIN_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const query = url.searchParams.get("q")?.trim() ?? "";

  const where = query
    ? {
        OR: [
          { fullName: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query } },
          { bookingCode: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: format === "csv" ? 5000 : 300,
    include: {
      tickets: { select: { checkedInAt: true, seats: true, token: true } },
    },
  });

  if (format === "csv") {
    const header = [
      "Booking ID",
      "Name",
      "Email",
      "Phone",
      "Pass",
      "Quantity",
      "People",
      "Amount (INR)",
      "Status",
      "Checked in",
      "Ticket email sent",
      "Booked at (IST)",
    ];

    const rows = registrations.map((r) => {
      const checkedIn = r.tickets.filter((t) => t.checkedInAt).length;
      return [
        r.bookingCode,
        r.fullName,
        r.email,
        r.phone,
        PASSES[r.passType].name,
        r.quantity,
        r.seats,
        (r.amountPaise / 100).toFixed(2),
        r.status,
        `${checkedIn}/${r.tickets.length}`,
        r.emailSentAt ? "yes" : "no",
        r.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      ].map(csvCell).join(",");
    });

    // BOM so Excel reads the UTF-8 rupee and accented names correctly.
    const csv = `﻿${header.map(csvCell).join(",")}\n${rows.join("\n")}\n`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="smirknraas-registrations-${
          new Date().toISOString().slice(0, 10)
        }.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      registrations: registrations.map((r) => ({
        id: r.id,
        bookingCode: r.bookingCode,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        passType: r.passType,
        passName: PASSES[r.passType].name,
        quantity: r.quantity,
        seats: r.seats,
        amountPaise: r.amountPaise,
        status: r.status,
        emailSent: Boolean(r.emailSentAt),
        checkedIn: r.tickets.filter((t) => t.checkedInAt).length,
        ticketCount: r.tickets.length,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
