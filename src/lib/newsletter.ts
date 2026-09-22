import "server-only";
import { db } from "./db";
import { emailDeliverable, sendMail } from "./email";
import { createUnsubscribeToken } from "./tokens";
import { appUrl, formatDateTime } from "./utils";
import { liveOfferWhere } from "./community";
import { SITE_NAME } from "./constants";

type Frequency = "DAILY" | "WEEKLY";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Content published since `since`, plus upcoming events for the coming window. */
export async function buildDigest(frequency: Frequency, now = new Date()) {
  const days = frequency === "DAILY" ? 1 : 7;
  const since = new Date(now.getTime() - days * 86_400_000);
  const horizon = new Date(now.getTime() + (frequency === "DAILY" ? 3 : 14) * 86_400_000);

  const [offers, businesses, events] = await Promise.all([
    db.offer.findMany({
      where: { ...liveOfferWhere(now), createdAt: { gte: since } },
      include: { business: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.business.findMany({
      where: { subscriptionStatus: "ACTIVE", createdAt: { gte: since } },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.event.findMany({
      where: { startsAt: { gte: now, lte: horizon } },
      include: { org: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
  ]);
  return { offers, businesses, events };
}

type Digest = Awaited<ReturnType<typeof buildDigest>>;

export function isEmpty(d: Digest) {
  return d.offers.length === 0 && d.businesses.length === 0 && d.events.length === 0;
}

export function renderDigest(d: Digest, frequency: Frequency, name: string, unsubscribeUrl: string) {
  const label = frequency === "DAILY" ? "Daily" : "Weekly";
  const section = (title: string, items: string[]) =>
    items.length
      ? `<h2 style="font-size:18px;color:#006596;margin:24px 0 8px">${title}</h2><ul style="padding-left:18px;margin:0">${items.join("")}</ul>`
      : "";

  const offers = d.offers.map(
    (o) =>
      `<li style="margin-bottom:8px"><a href="${appUrl(`/business/${o.business.slug}`)}"><strong>${esc(o.title)}</strong></a> at ${esc(o.business.name)}${o.discount ? ` — ${esc(o.discount)}` : ""}${o.exclusive ? " <em>(members only)</em>" : ""}</li>`,
  );
  const businesses = d.businesses.map(
    (b) =>
      `<li style="margin-bottom:8px"><a href="${appUrl(`/business/${b.slug}`)}"><strong>${esc(b.name)}</strong></a>${b.category ? ` · ${esc(b.category.name)}` : ""}</li>`,
  );
  const events = d.events.map(
    (e) =>
      `<li style="margin-bottom:8px"><strong>${esc(e.title)}</strong> — ${formatDateTime(e.startsAt)}${e.location ? ` @ ${esc(e.location)}` : ""} <span style="color:#666">(${esc(e.org.name)})</span></li>`,
  );

  const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;color:#2c2c2d">
<div style="height:4px;background:linear-gradient(90deg,#11b365,#07b9e2,#006596)"></div>
<img src="${appUrl("/brand/logo-horizontal.png")}" alt="${SITE_NAME}" width="260" style="margin:20px 0 4px">
<h1 style="color:#006596;font-weight:normal">${label} digest</h1>
<p>Hi ${esc(name)}, here's what's new around ${SITE_NAME}.</p>
${section("New special offers", offers)}
${section("New local businesses", businesses)}
${section("Upcoming events", events)}
<p style="margin-top:32px"><a href="${appUrl("/offers")}">See all offers</a> · <a href="${appUrl("/events")}">See all events</a></p>
<p style="font-size:12px;color:#888;margin-top:32px">You're receiving this because you subscribed to the ${label.toLowerCase()} ${SITE_NAME} newsletter.
<a href="${unsubscribeUrl}">Unsubscribe</a> or <a href="${appUrl("/account")}">change frequency</a>.</p></div>`;

  const text = [
    `${SITE_NAME} ${label}`,
    "",
    ...(d.offers.length ? ["NEW SPECIAL OFFERS", ...d.offers.map((o) => `- ${o.title} at ${o.business.name}`), ""] : []),
    ...(d.businesses.length ? ["NEW LOCAL BUSINESSES", ...d.businesses.map((b) => `- ${b.name}`), ""] : []),
    ...(d.events.length ? ["UPCOMING EVENTS", ...d.events.map((e) => `- ${e.title} (${formatDateTime(e.startsAt)})`), ""] : []),
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject: `${SITE_NAME} ${label}: offers, new businesses & events`, html, text };
}

/**
 * Send the digest to every subscriber of `frequency` who hasn't received one
 * within the current window. Safe to call more often than the schedule.
 */
export async function sendNewsletters(frequency: Frequency, now = new Date()) {
  if (!emailDeliverable) return { frequency, sent: 0, skipped: "SMTP not configured" };
  const windowMs = (frequency === "DAILY" ? 1 : 7) * 86_400_000 - 60 * 60 * 1000; // 1h slack
  const digest = await buildDigest(frequency, now);
  if (isEmpty(digest)) return { frequency, sent: 0, skipped: "no new content" };

  const recipients = await db.user.findMany({
    where: {
      newsletter: frequency,
      OR: [{ lastNewsletterAt: null }, { lastNewsletterAt: { lte: new Date(now.getTime() - windowMs) } }],
    },
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  for (const r of recipients) {
    const token = await createUnsubscribeToken(r.id);
    const mail = renderDigest(digest, frequency, r.name, appUrl(`/unsubscribe?token=${token}`));
    try {
      await sendMail({ to: r.email, ...mail });
      await db.user.update({ where: { id: r.id }, data: { lastNewsletterAt: now } });
      sent++;
    } catch (err) {
      console.error(`newsletter: failed to send to ${r.email}`, err);
    }
  }
  return { frequency, sent, recipients: recipients.length };
}
