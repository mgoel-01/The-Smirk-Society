import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PASSES, VENUE_CAPACITY, formatInr } from "@/lib/pricing";
import { EVENT } from "@/lib/event";
import { AdminActions } from "@/components/AdminActions";

export const metadata: Metadata = {
  title: "Organiser dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [paid, pending, failed, recent, checkedInCount] = await Promise.all([
    prisma.registration.aggregate({
      where: { status: "PAID" },
      _sum: { amountPaise: true, seats: true },
      _count: true,
    }),
    prisma.registration.count({ where: { status: "PENDING" } }),
    prisma.registration.count({ where: { status: "FAILED" } }),
    prisma.registration.findMany({
      where: { status: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { tickets: { select: { checkedInAt: true } } },
    }),
    prisma.ticket.count({ where: { checkedInAt: { not: null } } }),
  ]);

  // Only flag undelivered emails when email is actually switched on;
  // otherwise every row would carry a warning that means nothing.
  const emailEnabled = Boolean(process.env.RESEND_API_KEY);

  const seatsSold = paid._sum.seats ?? 0;
  const revenuePaise = paid._sum.amountPaise ?? 0;
  const fillPercent = Math.min(
    100,
    Math.round((seatsSold / VENUE_CAPACITY) * 100),
  );

  const stats = [
    { label: "Revenue", value: formatInr(revenuePaise), accent: true },
    { label: "Bookings", value: String(paid._count) },
    { label: "People coming", value: `${seatsSold} / ${VENUE_CAPACITY}` },
    { label: "Checked in", value: String(checkedInCount) },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-night-600/50 bg-night-900/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-muted">
              {EVENT.host}
            </p>
            <h1 className="font-script text-2xl text-gold-400">
              Organiser dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/scan"
              className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
            >
              Scan at gate
            </Link>
            <AdminActions />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-night-500/70 bg-night-800/55 p-5"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                {stat.label}
              </p>
              <p
                className={`mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${
                  stat.accent ? "text-emerald-400" : "text-cream"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-night-500/70 bg-night-800/55 p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Venue filled</span>
            <span className="font-medium text-gold-400">{fillPercent}%</span>
          </div>
          <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-night-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-600 to-gold-500 transition-all"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] text-muted">
            {pending} checkout{pending === 1 ? "" : "s"} in progress ·{" "}
            {failed} failed or abandoned
          </p>
        </div>

        <h2 className="mt-9 font-display text-xl text-cream">
          Recent bookings
        </h2>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-night-500/70">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-night-800/80 text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Pass</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium">In</th>
                <th className="px-4 py-3 font-medium">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-600/50 bg-night-900/40">
              {recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    No bookings yet. They will appear here the moment the first
                    pass is paid for.
                  </td>
                </tr>
              )}

              {recent.map((registration) => {
                const checkedIn = registration.tickets.filter(
                  (t) => t.checkedInAt,
                ).length;
                return (
                  <tr key={registration.id} className="hover:bg-night-800/45">
                    <td className="px-4 py-3 font-mono text-xs text-gold-400">
                      {registration.bookingCode}
                    </td>
                    <td className="px-4 py-3 text-cream">
                      {registration.fullName}
                      {emailEnabled && !registration.emailSentAt && (
                        <span
                          className="ml-2 rounded bg-amber-500/18 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-amber-300"
                          title="The ticket email could not be delivered"
                        >
                          no email
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <div>{registration.email}</div>
                      <div>{registration.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-cream/80">
                      {PASSES[registration.passType].name}
                      <span className="text-muted"> × {registration.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-cream">
                      {formatInr(registration.amountPaise)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span
                        className={
                          checkedIn === registration.tickets.length &&
                          checkedIn > 0
                            ? "text-emerald-400"
                            : "text-muted"
                        }
                      >
                        {checkedIn}/{registration.tickets.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {registration.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-muted">
          Showing the 60 most recent paid bookings. Use “Download CSV” for the
          full list.
        </p>
      </main>
    </div>
  );
}
