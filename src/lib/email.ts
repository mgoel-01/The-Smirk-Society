import "server-only";
import { Resend } from "resend";
import { env } from "./env";
import { EVENT, mapsUrl, sharePassOnWhatsAppUrl } from "./event";
import { formatInr } from "./pricing";
import { qrPngBuffer } from "./qr";

/** User-supplied text goes into HTML — escape it or a name becomes markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type TicketEmailPayload = {
  to: string;
  fullName: string;
  bookingCode: string;
  passName: string;
  quantity: number;
  seats: number;
  amountPaise: number;
  tickets: { token: string; seats: number }[];
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Helvetica, Arial, sans-serif";

function buildHtml(p: TicketEmailPayload): string {
  const name = esc(p.fullName.split(" ")[0] || p.fullName);

  const ticketLinks = p.tickets
    .map((t, i) => {
      const url = `${env.siteUrl}/ticket/${t.token}`;
      const label =
        p.tickets.length > 1
          ? `Pass ${i + 1} of ${p.tickets.length}`
          : "View your pass";
      // The secondary link opens the reader's own WhatsApp with this pass
      // ready to forward, which is how most guests will want to carry it and
      // how a group leader hands each pass to the person it belongs to.
      const share = sharePassOnWhatsAppUrl(url, name);
      return `
        <tr><td style="padding:6px 0;">
          <a href="${url}" style="display:block;background:#C2185B;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700;font-size:15px;text-align:center;font-family:${SANS};">
            ${label} &nbsp;&middot;&nbsp; Admits ${t.seats}
          </a>
        </td></tr>
        <tr><td style="padding:0 0 10px;text-align:center;">
          <a href="${share}" style="color:#25D366;text-decoration:none;font-size:12px;font-weight:700;font-family:${SANS};">
            Send this pass to WhatsApp &rarr;
          </a>
        </td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#1A0610;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1A0610;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#26091A;border:1px solid #4A1730;border-radius:16px;overflow:hidden;">

    <tr><td style="padding:30px 32px 10px;text-align:center;">
      <div style="color:#E8C9A0;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:${SANS};">${esc(EVENT.host)} presents</div>
      <div style="color:#F5D9A8;font-size:34px;font-weight:700;margin:10px 0 4px;font-family:${SERIF};letter-spacing:1px;">${esc(EVENT.name)} ${EVENT.year}</div>
      <div style="color:#D98BA8;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:${SANS};">${esc(EVENT.tagline)}</div>
    </td></tr>

    <tr><td style="padding:18px 32px 0;">
      <p style="color:#F3E3D0;font-size:16px;line-height:1.6;margin:0 0 6px;font-family:${SANS};">Hi ${name}, you are in!</p>
      <p style="color:#C9AFA0;font-size:14px;line-height:1.7;margin:0;font-family:${SANS};">Your payment is confirmed. Show the QR code at the entrance &mdash; it is attached to this email too, so you can save it to your phone right now.</p>
    </td></tr>

    <tr><td style="padding:22px 32px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1D0713;border:1px solid #4A1730;border-radius:12px;">
        <tr><td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${SANS};font-size:14px;">
            <tr><td style="color:#9C8378;padding:5px 0;">Booking ID</td>
                <td style="color:#F5D9A8;text-align:right;font-weight:700;letter-spacing:1px;">${esc(p.bookingCode)}</td></tr>
            <tr><td style="color:#9C8378;padding:5px 0;">Pass</td>
                <td style="color:#F3E3D0;text-align:right;">${esc(p.passName)} &times; ${p.quantity}</td></tr>
            <tr><td style="color:#9C8378;padding:5px 0;">Admits</td>
                <td style="color:#F3E3D0;text-align:right;">${p.seats} ${p.seats === 1 ? "person" : "people"}</td></tr>
            <tr><td style="color:#9C8378;padding:5px 0;">Amount paid</td>
                <td style="color:#7BD88F;text-align:right;font-weight:700;">${formatInr(p.amountPaise)}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:14px 32px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${ticketLinks}</table>
    </td></tr>

    <tr><td style="padding:16px 32px 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${SANS};font-size:14px;">
        <tr><td style="color:#9C8378;padding:5px 0;">When</td>
            <td style="color:#F3E3D0;text-align:right;">${EVENT.dateLabel}, ${EVENT.timeLabel}</td></tr>
        <tr><td style="color:#9C8378;padding:5px 0;">Where</td>
            <td style="text-align:right;"><a href="${mapsUrl}" style="color:#F5D9A8;text-decoration:underline;">${esc(EVENT.venue)}, ${esc(EVENT.venueArea)}</a></td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:22px 32px 30px;">
      <div style="border-top:1px solid #3C1226;padding-top:16px;color:#8B7166;font-size:12px;line-height:1.7;font-family:${SANS};">
        Keep this QR private &mdash; anyone holding it can use your entry. Each pass scans once.<br>
        Questions? Reply to this email or DM <a href="${EVENT.instagramUrl}" style="color:#D98BA8;">@${EVENT.instagram}</a>.
      </div>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

function buildText(p: TicketEmailPayload): string {
  const links = p.tickets
    .map(
      (t, i) =>
        `  Pass ${i + 1} (admits ${t.seats}): ${env.siteUrl}/ticket/${t.token}`,
    )
    .join("\n");

  return [
    `You are in, ${p.fullName}!`,
    ``,
    `${EVENT.name} ${EVENT.year} - ${EVENT.tagline}`,
    `${EVENT.dateLabel}, ${EVENT.timeLabel}`,
    `${EVENT.venue}, ${EVENT.venueArea}`,
    ``,
    `Booking ID: ${p.bookingCode}`,
    `Pass: ${p.passName} x ${p.quantity} (admits ${p.seats})`,
    `Paid: ${formatInr(p.amountPaise)}`,
    ``,
    `Your passes:`,
    links,
    ``,
    `Tip: open a pass link on your phone and tap "Send to WhatsApp" to keep it`,
    `in a chat, so you are not hunting through email at the gate.`,
    ``,
    `Show the QR code at the entrance. Keep it private - each pass scans once.`,
    `Questions? Reply here or DM @${EVENT.instagram}.`,
  ].join("\n");
}

/**
 * Sends the ticket. Returns false instead of throwing: a failed email must
 * never roll back a successful payment. The booking stays valid, the ticket
 * page still works, and the admin dashboard flags anything left unsent.
 */
export async function sendTicketEmail(p: TicketEmailPayload): Promise<boolean> {
  if (!env.resendApiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set - skipping ticket email for ${p.bookingCode}`,
    );
    return false;
  }

  try {
    const resend = new Resend(env.resendApiKey);

    const attachments = await Promise.all(
      p.tickets.map(async (t, i) => ({
        filename:
          p.tickets.length > 1
            ? `${p.bookingCode}-pass-${i + 1}.png`
            : `${p.bookingCode}.png`,
        content: (
          await qrPngBuffer(`${env.siteUrl}/ticket/${t.token}`)
        ).toString("base64"),
      })),
    );

    const { error } = await resend.emails.send({
      from: env.emailFrom,
      to: p.to,
      replyTo: env.supportEmail,
      subject: `Your ${EVENT.name} ${EVENT.year} pass - ${p.bookingCode}`,
      html: buildHtml(p),
      text: buildText(p),
      attachments,
    });

    if (error) {
      console.error("[email] Resend rejected the message:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send ticket email:", err);
    return false;
  }
}
