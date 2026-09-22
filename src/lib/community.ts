import "server-only";
import { cache } from "react";
import { db } from "./db";
import { DEFAULT_COMMUNITY_SLUG } from "./constants";

export const getCommunity = cache(async () => {
  const community = await db.community.findUnique({ where: { slug: DEFAULT_COMMUNITY_SLUG } });
  if (!community) throw new Error(`Community "${DEFAULT_COMMUNITY_SLUG}" not found. Run \`npm run db:seed\`.`);
  return community;
});

/** Where clause for offers that are currently live on active listings. */
export function liveOfferWhere(now = new Date()) {
  return {
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    business: { subscriptionStatus: "ACTIVE" },
  };
}
