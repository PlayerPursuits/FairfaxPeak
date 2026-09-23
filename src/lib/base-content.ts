// Base content every environment needs: the Fairfax Peak community, its
// "About the area" highlights, and business categories. Idempotent — it only
// creates what's missing and never overwrites existing rows.
import type { PrismaClient } from "@prisma/client";

export const CATEGORIES = [
  ["automotive", "Automotive", "🚗"],
  ["medical", "Medical", "🩺"],
  ["wellness-beauty", "Wellness & Beauty", "💆"],
  ["home-services", "Home Services", "🔧"],
  ["restaurants-food", "Restaurants & Food", "🍽️"],
  ["shopping-retail", "Shopping & Retail", "🛍️"],
  ["professional-services", "Professional Services", "💼"],
  ["fitness-recreation", "Fitness & Recreation", "🏃"],
  ["pets", "Pets", "🐾"],
  ["education-childcare", "Education & Childcare", "🎒"],
  ["real-estate", "Real Estate", "🏡"],
  ["arts-entertainment", "Arts & Entertainment", "🎭"],
] as const;
export type CategorySlug = (typeof CATEGORIES)[number][0];

const COMMUNITY = {
  slug: "fairfax-peak",
  name: "Fairfax Peak",
  tagline: "Discover the shops, services, and neighbors that make our mountain town home.",
  description:
    "Nestled at the foot of its namesake summit, Fairfax Peak is a close-knit community of trail runners, small-business owners, young families, and lifelong residents.\n\nFrom the Saturday farmers market on the Town Green to sunset hikes up Summit Trail, there's always something happening — and local businesses are at the heart of it all.",
};

const HIGHLIGHTS = [
  { title: "Summit Trail", body: "A 3.2-mile loop with panoramic views of the valley. Trailhead parking on Ridgeline Rd.", imageUrl: "/seed/photo-3-0.svg" },
  { title: "Saturday Farmers Market", body: "Local produce, baked goods, and crafts on the Town Green, 8am–1pm through November.", imageUrl: "/seed/photo-5-1.svg" },
  { title: "Historic Main Street", body: "Stroll five blocks of locally owned cafés, boutiques, and galleries.", imageUrl: "/seed/photo-1-2.svg", linkUrl: "/directory" },
  { title: "Community Calendar", body: "Council meetings, festivals, library programs, and volunteer days.", imageUrl: "/seed/photo-2-0.svg", linkUrl: "/events" },
];

export async function seedBase(db: PrismaClient) {
  const community = await db.community.upsert({ where: { slug: COMMUNITY.slug }, update: {}, create: COMMUNITY });

  if ((await db.areaHighlight.count({ where: { communityId: community.id } })) === 0) {
    await db.areaHighlight.createMany({
      data: HIGHLIGHTS.map((h, i) => ({ ...h, communityId: community.id, sortOrder: i })),
    });
  }

  const categories = new Map<string, string>();
  for (const [i, [slug, name, icon]] of CATEGORIES.entries()) {
    const c = await db.category.upsert({ where: { slug }, update: {}, create: { slug, name, icon, sortOrder: i } });
    categories.set(slug, c.id);
  }
  return { community, categories };
}
