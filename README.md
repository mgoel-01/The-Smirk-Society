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
| `/ticket/[token]` | The issued pass with its QR code |
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

### 4. Set up email (optional but recommended)

Sign up at [resend.com](https://resend.com), create an API key. Without this the site still works —
buyers just won't get a confirmation email, though their ticket page still loads.

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
2. Import it at [vercel.com](https://vercel.com).
3. Add every variable from `.env` into **Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your real domain (e.g. `https://smirknraas.com`) — ticket links
   in emails are built from it.
5. Deploy.

### Then add the webhook — do not skip this

In the Razorpay dashboard, **Settings → Webhooks → Add New Webhook**:

- **URL:** `https://your-domain.com/api/webhooks/razorpay`
- **Secret:** the same string you put in `RAZORPAY_WEBHOOK_SECRET`
- **Events:** `payment.captured`, `payment.failed`, `order.paid`

This is the safety net. If a guest pays and then closes their browser before the page redirects,
the webhook is what still issues their ticket.

### Going live

Swap the `rzp_test_…` keys for `rzp_live_…` keys in Vercel's environment variables (both
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

The camera needs HTTPS, which the deployed site has. Chrome on Android is the most reliable.
If a camera ever fails, paste the ticket link from the guest's email into the manual box — it does
the same thing.

Download a CSV of all bookings from the dashboard before the event as an offline backup.

---

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
