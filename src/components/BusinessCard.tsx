import Link from "next/link";
import { Stars } from "./Stars";

type Business = {
  slug: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  coverUrl?: string | null;
  city: string | null;
  category: { name: string; icon: string } | null;
  images?: { url: string }[];
  rating?: number | null;
  reviewCount?: number;
  offerCount?: number;
};

export function BusinessCard({ b }: { b: Business }) {
  const cover = b.coverUrl ?? b.images?.[0]?.url;
  return (
    <Link href={`/business/${b.slug}`} className="card group flex h-full flex-col overflow-hidden text-inherit no-underline transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-36 bg-gradient-to-br from-brand-100 to-brand-200">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        )}
        {b.offerCount ? (
          <span className="badge absolute top-3 right-3 bg-accent-400 text-brand-900 shadow">
            {b.offerCount} offer{b.offerCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 gap-3 p-4">
        <div className="relative z-10 -mt-10 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-brand-700 text-xl text-white shadow">
          {b.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            b.category?.icon ?? b.name[0]
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold group-hover:text-brand-700">{b.name}</h3>
          <p className="text-xs text-stone-500">
            {[b.category?.name, b.city].filter(Boolean).join(" · ")}
          </p>
          {b.tagline && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{b.tagline}</p>}
          {b.rating !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={b.rating} size="text-sm" showValue />
              {b.reviewCount ? <span className="text-xs text-stone-500">({b.reviewCount})</span> : null}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
