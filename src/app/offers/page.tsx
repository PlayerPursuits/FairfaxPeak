import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { claimedOfferIds, listLiveOffers } from "@/lib/queries";
import { OfferCard } from "@/components/OfferCard";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { T } from "@/components/T";

export const metadata: Metadata = { title: "Special Offers" };
export const dynamic = "force-dynamic";

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const user = await getCurrentUser();
  const [all, claimed] = await Promise.all([listLiveOffers(), claimedOfferIds(user?.id)]);
  const offers = filter === "members" ? all.filter((o) => o.exclusive) : all;

  return (
    <>
      <PageHeader eyebrow={<T k="offers.eyebrow">Special offers</T>} title={<T k="offers.title">Deals from your neighbors</T>}>
        <T k="offers.intro">Coupons and specials from Fairfax Peak member businesses. Offers marked Members only require a free resident account.</T>
      </PageHeader>
      <div className="container-page py-10">
        <div className="mb-6 flex gap-2">
          <Link href="/offers" className={filter !== "members" ? "btn-primary btn-sm" : "btn-outline btn-sm"}>
            All offers ({all.length})
          </Link>
          <Link href="/offers?filter=members" className={filter === "members" ? "btn-primary btn-sm" : "btn-outline btn-sm"}>
            ★ Members only ({all.filter((o) => o.exclusive).length})
          </Link>
        </div>
        {offers.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} signedIn={!!user} claimed={claimed.has(o.id)} back={filter ? `/offers?filter=${filter}` : "/offers"} />
            ))}
          </div>
        ) : (
          <EmptyState title="No offers right now">Check back soon — new deals are added every week.</EmptyState>
        )}
      </div>
    </>
  );
}
