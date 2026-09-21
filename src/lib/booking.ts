import "server-only";
import { Prisma, type PassType } from "@prisma/client";
import { prisma } from "./prisma";
import { PASSES, VENUE_CAPACITY, quoteFor } from "./pricing";
import { newBookingCode, newTicketToken } from "./ids";
import { sendTicketEmail } from "./email";

/**
 * Seats already committed. PENDING orders are counted too: a checkout window
 * is open for them, and overselling is far worse than briefly under-selling.
 * Stale pending orders age out via `releaseStalePending`.
 */
export async function seatsTaken(): Promise<number> {
  const result = await prisma.registration.aggregate({
    _sum: { seats: true },
    where: {
      OR: [
        { status: "PAID" },
        {
          status: "PENDING",
          // an abandoned checkout stops holding seats after 20 minutes
          createdAt: { gte: new Date(Date.now() - 20 * 60 * 1000) },
        },
      ],
    },
  });
  return result._sum.seats ?? 0;
}

export async function seatsRemaining(): Promise<number> {
  return Math.max(0, VENUE_CAPACITY - (await seatsTaken()));
}

/**
 * Marks long-abandoned checkouts as FAILED so their seats return to the pool.
 * Cheap enough to run opportunistically before each new order.
 */
export async function releaseStalePending(): Promise<void> {
  await prisma.registration.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - 20 * 60 * 1000) },
    },
    data: { status: "FAILED", failureReason: "Checkout abandoned" },
  });
}

export type PendingBooking = {
  fullName: string;
  email: string;
  phone: string;
  passType: PassType;
  quantity: number;
  razorpayOrderId: string;
  ipHash?: string;
  userAgent?: string;
};

/**
 * Persists the PENDING registration that backs a freshly created Razorpay
 * order. Retries once on the (vanishingly unlikely) booking-code collision.
 */
export async function createPendingRegistration(input: PendingBooking) {
  const quote = quoteFor(input.passType, input.quantity);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.registration.create({
        data: {
          bookingCode: newBookingCode(),
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          passType: input.passType,
          quantity: quote.quantity,
          seats: quote.seats,
          amountPaise: quote.amountPaise,
          razorpayOrderId: input.razorpayOrderId,
          ipHash: input.ipHash,
          userAgent: input.userAgent?.slice(0, 255),
        },
      });
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        String(err.meta?.target ?? "").includes("bookingCode");
      if (!isCodeCollision) throw err;
    }
  }
  throw new Error("Could not allocate a unique booking code.");
}

export type ConfirmResult =
  | { outcome: "confirmed"; bookingCode: string; firstTicketToken: string }
  | { outcome: "already-confirmed"; bookingCode: string; firstTicketToken: string }
  | { outcome: "not-found" };

/**
 * Turns a verified payment into issued tickets.
 *
 * Idempotency is the whole point of this function. Both the browser callback
 * and the Razorpay webhook call it for the same payment, often at the same
 * moment. The conditional `updateMany` on status = PENDING is the gate: the
 * database decides exactly one caller wins, and only that caller mints tickets
 * and sends the email. Everyone else gets `already-confirmed`.
 */
export async function confirmRegistration(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  paymentMethod?: string;
}): Promise<ConfirmResult> {
  const registration = await prisma.registration.findUnique({
    where: { razorpayOrderId: params.razorpayOrderId },
    include: { tickets: { orderBy: { createdAt: "asc" } } },
  });

  if (!registration) return { outcome: "not-found" };

  const claimed = await prisma.registration.updateMany({
    where: { id: registration.id, status: "PENDING" },
    data: {
      status: "PAID",
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
      paymentMethod: params.paymentMethod,
      paidAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    // Someone else already confirmed it (or it was refunded/failed).
    const existing = registration.tickets[0];
    if (registration.status === "PAID" && existing) {
      return {
        outcome: "already-confirmed",
        bookingCode: registration.bookingCode,
        firstTicketToken: existing.token,
      };
    }
    return { outcome: "not-found" };
  }

  // We won the race — mint one ticket per pass purchased.
  const pass = PASSES[registration.passType];
  await prisma.ticket.createMany({
    data: Array.from({ length: registration.quantity }, () => ({
      registrationId: registration.id,
      token: newTicketToken(),
      seats: pass.seats,
    })),
  });

  const tickets = await prisma.ticket.findMany({
    where: { registrationId: registration.id },
    orderBy: { createdAt: "asc" },
    select: { token: true, seats: true },
  });

  const sent = await sendTicketEmail({
    to: registration.email,
    fullName: registration.fullName,
    bookingCode: registration.bookingCode,
    passName: pass.name,
    quantity: registration.quantity,
    seats: registration.seats,
    amountPaise: registration.amountPaise,
    tickets,
  });

  if (sent) {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { emailSentAt: new Date() },
    });
  }

  return {
    outcome: "confirmed",
    bookingCode: registration.bookingCode,
    firstTicketToken: tickets[0].token,
  };
}

/** Records a failed payment attempt without disturbing a confirmed booking. */
export async function markFailed(
  razorpayOrderId: string,
  reason: string,
): Promise<void> {
  await prisma.registration.updateMany({
    where: { razorpayOrderId, status: "PENDING" },
    data: { status: "FAILED", failureReason: reason.slice(0, 255) },
  });
}
