# Fairfax Peak — Hyper-local Business Directory

A community directory where residents find and review local businesses, claim special offers, and follow civic events and resources. Fairfax Peak is the first location; the `Community` model lets you add more later.

**Stack:** Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS 4 · Prisma (SQLite locally, Postgres in production) · Stripe subscriptions · Nodemailer.

## Quick start

```bash
npm install
cp .env.example .env          # then set AUTH_SECRET
npx prisma db push            # create the database
npm run db:seed               # sample Fairfax Peak data
npm run dev                   # http://localhost:3000
```

Demo logins (password `password123`). All seeded data is fictional.

| Role | Email |
|---|---|
| Resident | `resident@example.com` |
| Business (active) | `owner@trailheadcoffee.example` |
| Business (unpaid) | `owner@newbakery.example` |
| Civic | `clerk@fairfaxpeak.example` |
| Admin | `admin@fairfaxpeak.example` |

## Account types

| | Personal (Resident) | Business Owner | Civic & Local Government |
|---|---|---|---|
| Cost | Free | **$20/month or $200/year** | Free |
| Registration | Optional. Needed to review or claim members-only offers | Required. Listing is public only while the membership is active | Required |
| Profile | Name and email required. Phone, address, bio, photo optional | Category, overview, logo, image gallery (up to 24), contact info, hours, address with map and directions, reviews | Overview, type, logo, **repeating points of contact**, address with map |
| Can add | Reviews (1–5 stars) | Coupons and special offers (public or members-only, with start and expiry dates) | Events and resources |
| Newsletter | Daily / weekly / off | ✓ | ✓ |

## Pages

- `/`: hero search, **recently added special offers**, "About the area" content, categories, new businesses, upcoming events
- `/directory`: search and filter by category · `/business/[slug]`: full business profile
- `/offers`: all live offers (filter to members-only)
- `/events`, `/civic`, `/civic/[slug]`, `/resources`
- `/register`, `/login`, `/account` (dashboards for each role), `/account/billing`, `/unsubscribe`

## Billing (Stripe)

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, then point a webhook at `/api/stripe/webhook` with these events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`. Prices are created inline ($20/mo, $200/yr) unless you set `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`. Members manage cards and cancellation in the Stripe Billing Portal.

With **no Stripe keys, billing runs in demo mode**: choosing a plan activates the listing immediately, so you can try the whole site without payments.

## Newsletter

`GET /api/cron/newsletter` with `Authorization: Bearer $CRON_SECRET` sends the daily digest every run, and the weekly digest on Mondays. Add `?frequency=daily|weekly` to force one. `vercel.json` schedules it daily. The digest lists new offers, new businesses, and upcoming events, and each email has a signed one-click unsubscribe link. Nothing is sent when there's no new content. You can also run it by hand with `npm run newsletter -- weekly`.

Without `SMTP_HOST`, emails are written to `./.outbox/` so you can inspect them.

## Production notes

- **Database:** change `provider` in `prisma/schema.prisma` to `postgresql` and set `DATABASE_URL`.
- **Uploads:** images are stored in `public/uploads` (`src/lib/uploads.ts`). On serverless or ephemeral hosts, replace that module with S3, R2, or Vercel Blob.
- **Time zone:** event times are read in the server's time zone. Set `TZ` (for example `TZ=America/Denver`).
- **Maps:** the Google Maps embed and directions links need no API key.
