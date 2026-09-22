import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/LegalLayout";
import { EVENT } from "@/lib/event";
import { PASS_LIST, formatInr } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and conditions for attending ${EVENT.name} ${EVENT.year}.`,
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="21 September 2026">
      <p>
        These terms apply to every pass bought for {EVENT.name} {EVENT.year}
        (&ldquo;the event&rdquo;), organised by {EVENT.host} (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By completing a booking you agree to them.
      </p>

      <Section heading="1. The event">
        <p>
          {EVENT.name} {EVENT.year} takes place on {EVENT.dateLabel} from{" "}
          {EVENT.timeLabel} at {EVENT.venue}, {EVENT.venueArea}. Timings and the
          line-up of performers and stalls are indicative and may change.
        </p>
      </Section>

      <Section heading="2. Passes and pricing">
        <ul className="list-disc space-y-1.5 pl-5">
          {PASS_LIST.map((pass) => (
            <li key={pass.id}>
              <span className="text-cream">{pass.name}</span> —{" "}
              {formatInr(pass.pricePaise)}, admitting {pass.seats}{" "}
              {pass.seats === 1 ? "person" : "people"}.
            </li>
          ))}
        </ul>
        <p>
          Prices shown are final and inclusive. A pass admits only the number of
          people stated on it; additional guests need their own pass.
        </p>
      </Section>

      <Section heading="3. Your ticket">
        <p>
          After a successful payment your pass appears on screen with a QR
          code, which you can download and keep on your phone. That QR is your
          entry. Each pass scans once — once it has been used at the gate it
          cannot be used again.
        </p>
        <p>
          If you lose your pass, recover it at any time from{" "}
          <a href="/find" className="text-gold-500 underline underline-offset-2">
            Find my pass
          </a>{" "}
          using the email address and mobile number you booked with.
        </p>
        <p>
          Keep your QR private. We cannot tell who is holding a code, so anyone
          who presents it first may be admitted in your place.
        </p>
      </Section>

      <Section heading="4. Entry and conduct">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Carry a valid photo ID. We may ask to see it at the gate.</li>
          <li>
            Entry may be refused, without refund, to anyone who is intoxicated,
            behaves abusively, or poses a risk to other guests.
          </li>
          <li>
            Outside food, drinks, alcohol, weapons, and any illegal substance
            are not permitted.
          </li>
          <li>
            The venue and organisers may conduct security checks at the entrance.
          </li>
          <li>
            Children under 6 enter free with a paying adult. Ages 6 to 12 need a
            Child Pass. From 13 onwards a full pass is required. We may ask for
            proof of age at the gate.
          </li>
        </ul>
      </Section>

      <Section heading="5. Photography">
        <p>
          The event is photographed and filmed. By attending you consent to
          appearing in photographs and video that {EVENT.host} may use to
          promote future events. Tell a member of our team on the day if you
          would prefer not to be featured.
        </p>
      </Section>

      <Section heading="6. Liability">
        <p>
          You attend at your own risk. To the extent permitted by law,{" "}
          {EVENT.host} is not liable for loss, theft or damage to personal
          belongings, or for injury arising from your own conduct or from
          circumstances outside our reasonable control.
        </p>
        <p>
          If the event is cancelled or materially rescheduled by us, our
          liability is limited to the value of the pass you bought. See our{" "}
          <a href="/refunds" className="text-gold-500 underline underline-offset-2">
            refund policy
          </a>
          .
        </p>
      </Section>

      <Section heading="7. Changes to these terms">
        <p>
          We may update these terms before the event. The version published here
          at the time of your booking is the one that applies to you.
        </p>
      </Section>

      <Section heading="8. Governing law">
        <p>
          These terms are governed by the laws of India. Disputes fall under the
          exclusive jurisdiction of the courts at Ghaziabad, Uttar Pradesh.
        </p>
      </Section>
    </LegalLayout>
  );
}
