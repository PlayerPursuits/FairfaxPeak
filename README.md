# Fairfax Peak — Hyper-local Business Directory

A community directory where residents find and review local businesses, claim special offers, and follow civic events and resources. Fairfax Peak is the first location; the `Community` model lets you add more later.

**Stack:** Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL · Vercel Blob · Stripe subscriptions · Nodemailer. Hosted on **Vercel**.

## Quick start (local development)

Needs Node 20+ and Docker (for Postgres).

```bash
npm install
cp .env.example .env          # then set AUTH_SECRET
docker compose up -d          # local Postgres on :5432
npx prisma migrate deploy     # create tables
npm run db:seed               # fictional demo data (local only; wipes the database)
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

## Deploying to Vercel

1. **Import the repo:** at [vercel.com/new](https://vercel.com/new), import `PlayerPursuits/FairfaxPeak`. Name the project `fairfax-peak`. The Next.js defaults are correct; don't change the build settings.
2. **Add a database:** in the project, go to **Storage → Create → Neon (Postgres)** and connect it to all environments. This sets `DATABASE_URL`.
3. **Add image storage:** go to **Storage → Create → Blob** and connect it. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Environment variables** (**Settings → Environment Variables**):

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | a long random string (`openssl rand -base64 48`) |
   | `APP_URL` | your site URL, e.g. `https://fairfaxpeak.com` (no trailing slash) |
   | `CRON_SECRET` | another random string. Vercel sends it to the newsletter job automatically |
   | `TZ` | your time zone, e.g. `America/New_York` (used for event times) |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | from Stripe (see Billing). Without them, billing runs in demo mode |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | from your email provider (Postmark, SendGrid, Amazon SES…). Newsletters are skipped until these are set |

5. **Deploy.** Each build runs database migrations, then creates the Fairfax Peak community and categories if they're missing (`prisma/seed-base.ts`). It never adds demo data or overwrites existing rows.
6. **Domain:** add it under **Settings → Domains**, then update `APP_URL` and redeploy.
7. **Stripe webhook:** in Stripe → Developers → Webhooks, add `https://<your domain>/api/stripe/webhook` and paste its signing secret into `STRIPE_WEBHOOK_SECRET`.

After that, every push to the production branch redeploys automatically, and other branches get preview URLs. Preview deployments share the production database unless you connect a separate Neon branch to the Preview environment, which is worth doing once real members sign up.

**Creating an admin:** register normally, then in the Neon console's SQL editor run
`UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';`

**Demo data on the live site:** sign in as an admin and open **My account → Admin & demo data**. Choose a password for the demo accounts and click **Load demo data**. This adds fictional residents, businesses (with offers, photos and reviews) and civic organizations without touching real members. Click **Remove demo data** before launch to delete all of it in one step. Demo accounts are flagged with `User.isDemo`.

**Schema changes:** edit `prisma/schema.prisma`, then run `npm run db:migrate -- --name what_changed` locally and commit the new folder in `prisma/migrations`. The next deploy applies it.

## Notes

- **Images:** on Vercel, photos upload straight from the browser to Blob storage through `/api/upload`, which avoids Vercel's 4.5 MB request limit. Only signed-in users can upload; files must be JPG, PNG, WebP or GIF up to 5 MB, and forms accept only links to this project's own Blob store. Locally, without `BLOB_READ_WRITE_TOKEN`, files are saved to `public/uploads`.
- **Maps:** the Google Maps embed and directions links need no API key.
