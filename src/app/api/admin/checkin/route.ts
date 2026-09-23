import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { checkInSchema } from "@/lib/validation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { PASSES } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The QR encodes the full ticket URL, so accept either form: a pasted URL or
 * the bare token a staff member types in.
 */
function extractToken(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/ticket\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : trimmed;
}

export async function POST(request: Request) {
  const session = await verifyAdminSession(
    (await cookies()).get(ADMIN_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let input;
  try {
    input = checkInSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Unreadable code." }, { status: 400 });
    }
    throw err;
  }

  const token = extractToken(input.token);

  let ticket = await prisma.ticket.findUnique({
    where: { token },
    include: { registration: true },
  });

  // Fallback for a guest whose phone is dead: look the booking up by its
  // printed code and admit the first pass on it that has not been scanned.
  if (!ticket && /^SNR-[A-Z0-9]{4,12}$/i.test(token)) {
    const registration = await prisma.registration.findUnique({
      where: { bookingCode: token.toUpperCase() },
      include: {
        tickets: { orderBy: { createdAt: "asc" }, include: { registration: true } },
      },
    });
    ticket =
      registration?.tickets.find((t) => !t.checkedInAt) ??
      registration?.tickets[0] ??
      null;
  }

  if (!ticket) {
    return NextResponse.json(
      { status: "invalid", message: "Not a valid pass." },
      { status: 404 },
    );
  }

  if (ticket.registration.status !== "PAID") {
    return NextResponse.json({
      status: "invalid",
      message: `Booking is ${ticket.registration.status.toLowerCase()} — do not admit.`,
      booking: ticket.registration.bookingCode,
    });
  }

  // Atomic claim: `checkedInAt: null` in the WHERE clause means two staff
  // phones scanning the same QR at once cannot both succeed.
  const claimed = await prisma.ticket.updateMany({
    where: { id: ticket.id, checkedInAt: null },
    data: { checkedInAt: new Date(), checkedInBy: "admin" },
  });

  const pass = PASSES[ticket.registration.passType];

  if (claimed.count === 0) {
    const current = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      select: { checkedInAt: true },
    });
    return NextResponse.json({
      status: "already-used",
      message: "This pass was already scanned.",
      name: ticket.registration.fullName,
      booking: ticket.registration.bookingCode,
      passName: pass.name,
      passType: ticket.registration.passType,
      seats: ticket.seats,
      checkedInAt: current?.checkedInAt?.toISOString() ?? null,
    });
  }

  return NextResponse.json({
    status: "ok",
    message: `Admit ${ticket.seats}`,
    name: ticket.registration.fullName,
    booking: ticket.registration.bookingCode,
    passName: pass.name,
    passType: ticket.registration.passType,
    seats: ticket.seats,
    checkedInAt: new Date().toISOString(),
  });
}
