import "server-only";
import { db } from "./db";
import { liveOfferWhere } from "./community";
import { averageRating } from "./utils";

export const offerInclude = {
  business: { select: { name: true, slug: true, logoUrl: true, category: { select: { name: true, icon: true } } } },
} as const;

/** IDs of offers the given user has claimed, for rendering OfferCards. */
export async function claimedOfferIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const claims = await db.offerClaim.findMany({ where: { userId }, select: { offerId: true } });
  return new Set(claims.map((c) => c.offerId));
}

type BusinessFilter = { q?: string; category?: string; take?: number; orderBy?: "newest" | "name" };

/** Active businesses with rating/offer summaries for cards. */
export async function listBusinesses({ q, category, take, orderBy = "name" }: BusinessFilter = {}) {
  const now = new Date();
  const rows = await db.business.findMany({
    where: {
      subscriptionStatus: "ACTIVE",
      ...(category && { category: { slug: category } }),
      ...(q && {
        OR: [
          { name: { contains: q } },
          { tagline: { contains: q } },
          { description: { contains: q } },
          { category: { name: { contains: q } } },
        ],
      }),
    },
    include: {
      category: { select: { name: true, icon: true } },
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      reviews: { select: { rating: true } },
      offers: { where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] }, select: { id: true } },
    },
    orderBy: orderBy === "newest" ? { createdAt: "desc" } : { name: "asc" },
    take,
  });
  return rows.map(({ reviews, offers, ...b }) => ({
    ...b,
    rating: averageRating(reviews),
    reviewCount: reviews.length,
    offerCount: offers.length,
  }));
}

export function listLiveOffers(take?: number) {
  return db.offer.findMany({
    where: liveOfferWhere(),
    include: offerInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function listUpcomingEvents(take?: number) {
  return db.event.findMany({
    where: { OR: [{ startsAt: { gte: new Date() } }, { endsAt: { gte: new Date() } }] },
    include: { org: { select: { name: true, slug: true } } },
    orderBy: { startsAt: "asc" },
    take,
  });
}
