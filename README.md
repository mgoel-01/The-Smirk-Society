# Smirk'N'Raas 2026 — event site & ticketing

Registration and ticketing site for **Ghaziabad's Biggest Dandiya Night**, presented by The Smirk Society.
17th October 2026 · Chancellor Club, Chiranjiv Vihar · 6 PM onwards.

Guests pick a pass, pay through Razorpay, and get a QR ticket by email. Staff scan that QR at the gate.

---

## What's in the box

| Page | What it does |
|---|---|
| `/` | The event landing page — poster details, highlights, pricing, FAQ |
| `/register` | Pass selection, guest details, Razorpay checkout |
| `/ticket/[token]` | The issued pass with its QR code, and a downloadable copy |
| `/find` | Ticket recovery — email + phone brings a lost pass back |
| `/admin` | Organiser dashboard: revenue, bookings, CSV export |
| `/admin/scan` | Gate check-in — scans QR codes with the phone camera |
| `/contact` | Contact Us — Instagram, email, WhatsApp, phone, venue |
| `/terms`, `/privacy`, `/refunds` | Policy pages (Razorpay requires these to activate an account) |

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a database

Sign up at [neon.tech](https://neon.tech) (free tier is plenty), create a project, and copy the
connection string. It looks like `postgresql://user:pass@host/db?sslmode=require`.

### 3. Get Razorpay keys

1. Sign up at [razorpay.com](https://razorpay.com) and complete KYC.
2. Go to **Settings → API Keys** and generate a key pair.
3. Start with the **test** keys (`rzp_test_…`) so you can practise without real money.

### 4. Set up email (genuinely optional)

Guests download their pass as an image at checkout, and recover a lost one at
`/find` using the email and mobile number they booked with. Email is a
convenience on top of that, not the delivery mechanism — the site is fully
usable without it, and without a domain.

If you do want it:

Sign up at [resend.com](https://resend.com) and create an API key. Without this the site still
works — buyers just won't get a confirmation email, though their ticket page still loads and the
dashboard flags anything unsent.

**You need a domain to send properly.** Resend only lets you send from a domain you have verified
by adding its DNS records, so a Gmail address will not work as the sender. Without a domain,
tickets go out from Resend's shared `onboarding@resend.dev` address — fine for testing, but poor
deliverability and it looks untrustworthy on a real ticket. Buy a domain before selling to the
public; it also replaces the `*.vercel.app` URL with something you can print on a poster.

### 5. Configure

```bash
cp .env.example .env
npm run admin:hash -- "a strong password for the dashboard"
```

That command prints an `ADMIN_PASSWORD_HASH` and a `SESSION_SECRET`. Paste both into `.env`, then
fill in the rest of the values.

### 6. Create the tables

```bash
npm run db:push
```

### 7. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Testing a payment without spending money

With `rzp_test_…` keys, Razorpay's checkout accepts test instruments:

- **Card:** `4111 1111 1111 1111`, any future expiry, any CVV
- **UPI:** enter `success@razorpay`
- **Netbanking:** pick any bank and click *Success*

Complete a booking, confirm the ticket page loads and the email arrives, then scan the QR at
`/admin/scan` to check the whole loop end to end.

---

## Deploying

1. Push this folder to a GitHub repository.
2. Import it at [netlify.com](https://netlify.com) — its free tier allows
   commercial use, unlike Vercel's Hobby plan.
3. Add every variable from `.env` into **Site configuration → Environment
   variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your real domain — ticket links in emails are built from it.

See [DEPLOY.md](DEPLOY.md) for the full step-by-step.
5. Deploy.

### Then add the webhook — do not skip this

In the Razorpay dashboard, **Settings → Webhooks → Add New Webhook**:

- **URL:** `https://your-domain.com/api/webhooks/razorpay`
- **Secret:** the same string you put in `RAZORPAY_WEBHOOK_SECRET`
- **Events:** `payment.captured`, `payment.failed`, `order.paid`

This is the safety net. If a guest pays and then closes their browser before the page redirects,
the webhook is what still issues their ticket.

### Going live

Swap the `rzp_test_…` keys for `rzp_live_…` keys in Netlify's environment variables (both
`RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`), and redeploy. Razorpay requires the
`/terms`, `/privacy`, `/refunds` and `/contact` pages to be publicly reachable before it activates
live mode — they already are.

---

## How the money flow is kept safe

This part matters, so here is exactly what protects a real customer's payment:

**Prices are decided by the server, never the browser.** The registration form sends only a pass
type and a quantity. `src/lib/pricing.ts` is the single source of truth for every rupee figure, and
that is the amount sent to Razorpay and stored against the booking. A tampered client cannot buy a
₹2,800 pass for ₹1.

**Every confirmation is cryptographically verified.** When Razorpay reports a successful payment,
the server recomputes an HMAC-SHA256 signature over the order and payment IDs using the API secret
— which only the server holds — and compares it in constant time. A forged callback issues no
ticket.

**The webhook is verified against the raw request body**, for the same reason, using a separate
webhook secret.

**Confirmation is idempotent.** The browser callback and the webhook both confirm the same payment,
often simultaneously. A conditional database update decides a single winner, so a guest gets exactly
one set of tickets and exactly one email — never two.

**Check-in cannot be double-claimed.** Marking a pass as used is a conditional update on
`checkedInAt IS NULL`, so two staff phones scanning the same QR at the same moment cannot both
admit it.

**QR tokens are unguessable.** Each is 32 random bytes, which is what makes it safe for the ticket
page to work from a plain link with no login.

**Card details never reach this server.** The entire payment happens inside Razorpay's hosted
checkout. We store a name, an email, a phone number and a payment reference — nothing more.

Also in place: Zod validation on every input, rate limiting on checkout and admin login,
scrypt-hashed admin password, httpOnly `SameSite=Lax` session cookies, a strict Content-Security-Policy
and HSTS, CSV-injection escaping on the export, a bot honeypot on the form, and IP addresses stored
only as salted hashes.

---

## Running the gate on the night

1. Sign in at `/admin/login` on a phone.
2. Open **Scan at gate**, tap **Start camera**, allow camera access.
3. Point it at each guest's QR.
   - **Green** — admit the number of people shown.
   - **Amber** — this pass was already scanned. Check for a duplicate.
   - **Red** — not a valid pass.

The camera needs HTTPS, which the deployed site has. It works on any modern phone: Chrome on
Android uses the browser's native barcode decoder, and everything else — including every iPhone
browser, which has no native decoder at all — falls back to decoding in software. The software
path is slightly slower, so hold the phone steady for a moment.

If a camera ever fails, type the guest's booking code into the manual box, or paste the ticket
link from their email. Either works.

Download a CSV of all bookings from the dashboard before the event as an offline backup.

---

## Connecting your domain

One domain covers both the website and the ticket emails — they use different
DNS record types, so nothing conflicts.

| Purpose | Record | Set up in |
|---|---|---|
| Website | A / CNAME | Netlify → Domain management |
| Sending ticket emails | TXT (SPF + DKIM) | Resend → Domains |
| Receiving replies (optional) | MX | Your mailbox provider |

### 1. Point the website at Netlify

In Netlify, **Domain management → Add a domain**. It shows the exact records to
paste into your registrar. Then set `NEXT_PUBLIC_SITE_URL` to the new address
with no trailing slash — every ticket link in every email is built from it, so
this must be right before you sell anything.

### 2. Verify the domain in Resend

In Resend, **Domains → Add Domain**. It gives you TXT records to paste at your
registrar. Once verified, set:

```
EMAIL_FROM="Smirk Society <tickets@yourdomain.com>"
```

Consider verifying a subdomain (`send.yourdomain.com`) rather than the root, so
sending reputation stays isolated from your main domain.

### 3. Decide where replies go

Resend sends mail; it does not receive it. Guests who hit reply land at
whatever `SUPPORT_EMAIL` is set to, which can be an ordinary Gmail account —
they never see that address unless they reply.

For a real `hello@yourdomain.com` inbox you need a mailbox provider. Zoho Mail
is free for a custom domain; Google Workspace is paid. Either adds MX records.

> **Only ever publish one SPF record.** If you set up both Resend and a mailbox
> provider, merge their SPF values into a single TXT record. Two separate SPF
> records fail authentication for both, and mail starts landing in spam.

### 4. Check it end to end

Book a test pass and confirm the email arrives from your own domain, is not in
spam, and that the ticket link in it opens on the real site.

## Filling in your contact details

Open `src/lib/event.ts` and fill in the `CONTACT` block:

```ts
export const CONTACT: ContactDetails = {
  whatsapp: "919876543210",      // digits + country code, no + or spaces
  phone: "+91 98765 43210",
  address: "Your registered business address",
  hours: "10 AM to 8 PM, every day",
};
```

Each field is optional and **the UI hides a channel until it has a value**, so
nothing half-configured is ever shown to a guest. Adding a WhatsApp number also
switches on the floating chat button on the landing and booking pages.

Razorpay asks for a contact phone and a business address during account
activation, so fill those two in before applying. The support email comes from
`SUPPORT_EMAIL` in `.env`.

## Changing event details

Everything from the poster lives in `src/lib/event.ts`, and pass pricing lives in
`src/lib/pricing.ts`. Edit those two files and the landing page, tickets and emails all follow.

If you change prices, only future bookings are affected — bookings already paid keep the amount
they were charged.

---

## A note on the `overrides` in package.json

`@prisma/client` pulls in the Prisma CLI, which in turn pulls `mysql2` and
`deepmerge-ts` — both of which had open high-severity advisories at the versions
Prisma pins. Neither is reachable from this app (we speak Postgres, and the config
merger only runs at CLI time), but the `overrides` block forces the patched
versions so `npm audit` reports clean. Remove them once Prisma bumps its own pins.

## Project layout

```
prisma/schema.prisma     Database tables
src/lib/                 Pricing, auth, Razorpay, email, booking logic
src/app/api/             Order creation, payment verification, webhook, admin
src/app/                 Pages
src/components/          UI
scripts/hash-password.mjs
```
