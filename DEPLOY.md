# Deployment checklist

Work through these in order. Steps 1–4 get a live URL you can hand to Razorpay
for website verification. Steps 5–7 turn on real payments.

**Never commit secrets.** Everything below goes into Vercel's environment
variable settings, not into a file in this repo.

---

## 1. Database — Neon

1. Sign up at [neon.tech](https://neon.tech) with the business email.
2. Create a project. Region: pick **Singapore** or **Mumbai** — closest to your
   guests, so pages load faster.
3. From the dashboard, copy the **pooled** connection string. It looks like:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

Use the **pooled** one (it has `-pooler` in the host). Serverless functions open
many short connections, and the pooler is what stops them exhausting the limit.

## 2. Create the tables

With the connection string in your local `.env` as `DATABASE_URL`:

```bash
npm run db:push
```

## 3. Push to GitHub

Create an **empty private** repository (no README, no .gitignore — this project
already has both), then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

## 4. Deploy — Vercel

1. Sign up at [vercel.com](https://vercel.com) with the business email.
2. **Add New → Project** and import the repository.
3. Framework preset: Next.js. Leave build settings alone.
4. Add every environment variable from the table below.
5. Deploy.

You now have a live URL. **Give this to Razorpay for website verification.**

### Environment variables

| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | Neon, pooled connection string |
| `SESSION_SECRET` | `npm run admin:hash -- "<password>"` |
| `ADMIN_PASSWORD_HASH` | same command |
| `RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | same |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same value as `RAZORPAY_KEY_ID` |
| `RAZORPAY_WEBHOOK_SECRET` | you choose it; must match the webhook (step 6) |
| `NEXT_PUBLIC_SITE_URL` | your live URL, **no trailing slash** |
| `VENUE_CAPACITY` | `500` |
| `RESEND_API_KEY` | Resend (can be added later) |
| `EMAIL_FROM` | `Smirk Society <tickets@yourdomain.in>` (needs a verified domain) |
| `SUPPORT_EMAIL` | where guest replies should land |

Start with Razorpay **test** keys (`rzp_test_…`). No KYC needed for those.

## 5. Custom domain

Vercel → **Settings → Domains → Add**, then paste the record it shows into your
registrar's DNS. Afterwards update `NEXT_PUBLIC_SITE_URL` to the new address and
redeploy — **ticket links in emails are built from it**, so a stale value sends
guests to the wrong place.

## 6. Razorpay webhook — do not skip

Razorpay → **Settings → Webhooks → Add New Webhook**:

- **URL:** `https://<your-domain>/api/webhooks/razorpay`
- **Secret:** exactly the same string as `RAZORPAY_WEBHOOK_SECRET`
- **Events:** `payment.captured`, `payment.failed`, `order.paid`

This is the safety net. Without it, a guest who pays and then closes the tab
before the page redirects never receives their ticket.

## 7. Test the whole loop, then go live

With test keys, book a pass end to end:

- Card `4111 1111 1111 1111`, any future expiry, any CVV
- or UPI `success@razorpay`

Confirm: payment succeeds → ticket page loads with a QR → email arrives →
the QR scans green at `/admin/scan` → scanning it a second time shows amber.

Then swap `rzp_test_…` for `rzp_live_…` in **both** `RAZORPAY_KEY_ID` and
`NEXT_PUBLIC_RAZORPAY_KEY_ID`, and redeploy.

---

## Before the night

- [ ] Change the admin password from the generated one
- [ ] Download a CSV of bookings as an offline backup
- [ ] Sign in on the phone that will be used at the gate and test the scanner
- [ ] Check `VENUE_CAPACITY` matches the real limit
