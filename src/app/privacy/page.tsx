import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/LegalLayout";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${EVENT.host} collects and protects your personal data.`,
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="21 September 2026">
      <p>
        {EVENT.host} (&ldquo;we&rdquo;) runs {EVENT.name} {EVENT.year} and the
        booking site you are using. This page explains exactly what we collect,
        why, and what we do not collect.
      </p>

      <Section heading="What we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="text-cream">Your name, email and mobile number</span>
            , which you enter when booking. We need these to issue your ticket
            and to reach you if something about the event changes.
          </li>
          <li>
            <span className="text-cream">Your booking details</span> — pass type,
            quantity, amount paid, and whether the pass has been scanned.
          </li>
          <li>
            <span className="text-cream">A payment reference</span> from
            Razorpay: an order ID and a payment ID.
          </li>
          <li>
            <span className="text-cream">Limited technical data</span> — a
            one-way hash of your IP address and your browser&rsquo;s user-agent
            string, kept only to investigate fraudulent bookings. We do not
            store your IP address itself.
          </li>
        </ul>
      </Section>

      <Section heading="What we never collect">
        <p>
          <span className="text-cream">
            We never see or store your card number, CVV, UPI PIN, or net-banking
            credentials.
          </span>{" "}
          The entire payment happens inside Razorpay&rsquo;s own secure
          checkout. Those details go directly to Razorpay and never touch our
          servers.
        </p>
        <p>
          We do not use advertising trackers, and we do not build a marketing
          profile from your visit.
        </p>
      </Section>

      <Section heading="Who we share it with">
        <p>We share the minimum necessary with three service providers:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="text-cream">Razorpay</span> — to process your
            payment. Governed by Razorpay&rsquo;s own privacy policy.
          </li>
          <li>
            <span className="text-cream">Resend</span> — to deliver your ticket
            email.
          </li>
          <li>
            <span className="text-cream">Our hosting and database providers</span>{" "}
            — to run the site and store bookings.
          </li>
        </ul>
        <p>
          We do not sell your data, and we do not share it with anyone else
          unless the law requires it.
        </p>
      </Section>

      <Section heading="How it is protected">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The whole site is served over HTTPS.</li>
          <li>
            Bookings are stored in an access-controlled database that is not
            reachable from the public internet.
          </li>
          <li>
            The organiser dashboard is password-protected and rate-limited
            against guessing.
          </li>
          <li>
            Every payment confirmation is cryptographically verified before a
            ticket is issued.
          </li>
        </ul>
      </Section>

      <Section heading="How long we keep it">
        <p>
          We keep booking records for up to 12 months after the event, for
          accounting and to handle any disputes. After that they are deleted.
          Technical data is deleted within 90 days.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can ask us for a copy of the data we hold about you, ask us to
          correct it, or ask us to delete it. Message us on Instagram at{" "}
          <a
            href={EVENT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 underline underline-offset-2"
          >
            @{EVENT.instagram}
          </a>{" "}
          with your booking ID and we will action it within 30 days.
        </p>
        <p>
          Note that deleting your booking before the event also cancels your
          entry, since the ticket can no longer be verified at the gate.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          The public site sets no tracking cookies. A single session cookie is
          used on the organiser dashboard to keep the organiser signed in. It is
          strictly functional.
        </p>
      </Section>
    </LegalLayout>
  );
}
