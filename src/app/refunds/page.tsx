import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/LegalLayout";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: `Refund, cancellation and transfer policy for ${EVENT.name} ${EVENT.year}.`,
};

export default function RefundsPage() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" updated="21 September 2026">
      <Section heading="Passes are non-refundable">
        <p>
          Because catering, decor and performers are booked against confirmed
          numbers well before the night, all passes for {EVENT.name}{" "}
          {EVENT.year} are non-refundable and non-cancellable once payment is
          complete. Please double-check your pass type and quantity before
          paying.
        </p>
      </Section>

      <Section heading="But they are transferable">
        <p>
          If you cannot make it, give your pass to someone who can. Forward them
          the QR code from your confirmation email — whoever presents it at the
          gate will be admitted. You do not need to tell us, and there is no
          transfer fee.
        </p>
        <p>Remember that each pass scans only once.</p>
      </Section>

      <Section heading="If we cancel or reschedule">
        <p>
          If {EVENT.host} cancels the event outright, you receive a full refund
          of the amount you paid, to your original payment method, within 7
          working days.
        </p>
        <p>
          If we move the event to a different date, your pass stays valid for
          the new date. If that date does not work for you, tell us within 7
          days of the announcement and we will refund you in full.
        </p>
      </Section>

      <Section heading="Duplicate or failed payments">
        <p>
          If money left your account but you did not receive a ticket, or you
          were charged twice, contact us with your booking ID and the Razorpay
          payment reference. Verified duplicate charges are refunded in full
          within 5&ndash;7 working days.
        </p>
        <p>
          Payments that fail mid-way are usually reversed automatically by your
          bank within 5&ndash;7 working days without any action from us.
        </p>
      </Section>

      <Section heading="How refunds are paid">
        <p>
          Approved refunds are issued through Razorpay to the original payment
          method. We cannot redirect a refund to a different card, account or
          UPI ID.
        </p>
      </Section>

      <Section heading="Raising a request">
        <p>
          Message us on Instagram at{" "}
          <a
            href={EVENT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 underline underline-offset-2"
          >
            @{EVENT.instagram}
          </a>{" "}
          with your booking ID and a short description. We reply to every
          request within 3 working days.
        </p>
      </Section>
    </LegalLayout>
  );
}
