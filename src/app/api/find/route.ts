import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailSchema, phoneSchema } from "@/lib/validation";
import { PASSES } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const findSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
});

/**
 * Ticket recovery.
 *
 * Because there is no confirmation email, this is how a guest who closed the
 * tab gets back to their pass. It is therefore a way to reach someone else's
 * ticket if abused, so:
 *
 *  - BOTH email and phone must match. Either alone would make guessing far
 *    too easy, since an email address is often public.
 *  - It is rate limited hard. The pair is only brute-forceable at volume.
 *  - The response is identical whether nothing matched or the details were
 *    wrong, so it cannot be used to test whether someone booked.
 *
 * Even so, this only ever reveals a ticket to someone who already knows the
 * booker's email and phone number.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  const limit = rateLimit(`find:${ip}`, 6, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Too many lookups. Try again in ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} minutes, or message us on Instagram.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let input;
  try {
    input = findSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Enter the email address and mobile number you booked with." },
        { status: 400 },
      );
    }
    throw err;
  }

  const registrations = await prisma.registration.findMany({
    where: {
      email: input.email,
      phone: input.phone,
      status: "PAID",
    },
    orderBy: { createdAt: "desc" },
    include: { tickets: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(
    {
      bookings: registrations.map((r) => ({
        bookingCode: r.bookingCode,
        passName: PASSES[r.passType].name,
        quantity: r.quantity,
        seats: r.seats,
        bookedAt: r.createdAt.toISOString(),
        tickets: r.tickets.map((t) => ({
          token: t.token,
          seats: t.seats,
          used: Boolean(t.checkedInAt),
        })),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
