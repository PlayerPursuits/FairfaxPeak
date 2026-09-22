import Link from "next/link";
import { claimOffer } from "@/app/actions/offers";
import { formatDate } from "@/lib/utils";

type Offer = {
  id: string;
  title: string;
  description: string;
  discount: string | null;
  code: string | null;
  terms: string | null;
  exclusive: boolean;
  endsAt: Date | null;
  business?: { name: string; slug: string; logoUrl: string | null; category?: { name: string; icon: string } | null };
};

/**
 * Public offers show their code to everyone. Exclusive (member) offers show
 * the code only to signed-in members who have claimed it.
 */
export function OfferCard({
  offer,
  signedIn,
  claimed,
  back,
}: {
  offer: Offer;
  signedIn: boolean;
  claimed: boolean;
  back: string;
}) {
  const locked = offer.exclusive && !claimed;
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-start gap-3 border-b border-dashed border-stone-200 bg-sun-100/60 p-4">
        {offer.discount && (
          <span className="shrink-0 rounded-xl bg-sun-400 px-3 py-2 text-center font-display text-lg leading-tight font-bold text-pine-900">
            {offer.discount}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{offer.title}</h3>
          {offer.business && (
            <Link href={`/business/${offer.business.slug}`} className="text-sm font-medium hover:underline">
              {offer.business.name}
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {offer.exclusive && <span className="badge bg-pine-700 text-white">★ Members only</span>}
          {offer.business?.category && (
            <span className="badge bg-stone-100 text-stone-700">
              {offer.business.category.icon} {offer.business.category.name}
            </span>
          )}
          {offer.endsAt && <span className="badge bg-stone-100 text-stone-600">Ends {formatDate(offer.endsAt)}</span>}
        </div>
        <p className="text-sm text-stone-600">{offer.description}</p>
        {offer.terms && <p className="text-xs text-stone-500">{offer.terms}</p>}
        <div className="mt-auto pt-2">
          {locked ? (
            <form action={claimOffer}>
              <input type="hidden" name="offerId" value={offer.id} />
              <input type="hidden" name="back" value={back} />
              <button className="btn-primary btn-sm w-full">{signedIn ? "Claim offer" : "Sign in to claim"}</button>
            </form>
          ) : offer.code ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-dashed border-pine-300 bg-pine-50 px-3 py-2">
              <span className="text-xs font-medium text-pine-700 uppercase">Code</span>
              <code className="font-mono text-base font-bold tracking-wider text-pine-900">{offer.code}</code>
            </div>
          ) : (
            <p className="rounded-xl bg-pine-50 px-3 py-2 text-center text-xs font-medium text-pine-800">
              {offer.exclusive ? "Claimed — show this page in store" : "Mention Fairfax Peak in store"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
