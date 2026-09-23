import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { claimedOfferIds } from "@/lib/queries";
import { averageRating, formatAddress, formatDate } from "@/lib/utils";
import { Stars } from "@/components/Stars";
import { OfferCard } from "@/components/OfferCard";
import { Gallery } from "@/components/Gallery";
import { MapEmbed } from "@/components/MapEmbed";
import { ReviewForm } from "@/components/ReviewForm";
import { deleteReview } from "@/app/actions/reviews";
import { ConfirmButton } from "@/components/form";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const now = new Date();
  return db.business.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" } },
      offers: {
        where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await db.business.findUnique({ where: { slug: (await params).slug }, select: { name: true, tagline: true } });
  return b ? { title: b.name, description: b.tagline ?? undefined } : {};
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [b, user] = await Promise.all([load(slug), getCurrentUser()]);
  if (!b) notFound();
  const isOwner = user?.id === b.ownerId;
  // Unpaid listings are hidden from the public but visible to their owner as a preview.
  if (b.subscriptionStatus !== "ACTIVE" && !isOwner && user?.role !== "ADMIN") notFound();

  const claimed = await claimedOfferIds(user?.id);
  const rating = averageRating(b.reviews);
  const address = formatAddress(b);
  const myReview = user ? b.reviews.find((r) => r.userId === user.id) : null;
  const back = `/business/${b.slug}`;

  return (
    <>
      {isOwner && b.subscriptionStatus !== "ACTIVE" && (
        <div className="bg-accent-100 py-3 text-center text-sm text-brand-900">
          This is a preview. Your listing isn’t public yet — <Link href="/account/billing">activate your membership</Link>.
        </div>
      )}
      <section className="border-b border-stone-200 bg-white">
        <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-700 text-4xl text-white shadow">
            {b.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logoUrl} alt={`${b.name} logo`} className="h-full w-full object-cover" />
            ) : (
              b.category?.icon ?? b.name[0]
            )}
          </div>
          <div className="flex-1">
            {b.category && (
              <Link href={`/directory?category=${b.category.slug}`} className="text-sm font-semibold no-underline">
                {b.category.icon} {b.category.name}
              </Link>
            )}
            <h1 className="font-display text-4xl">{b.name}</h1>
            {b.tagline && <p className="mt-1 text-lg text-stone-600">{b.tagline}</p>}
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={rating} showValue />
              <a href="#reviews" className="text-sm">
                {b.reviews.length} review{b.reviews.length === 1 ? "" : "s"}
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {b.phone && (
              <a href={`tel:${b.phone}`} className="btn-primary">
                Call
              </a>
            )}
            {b.website && (
              <a href={b.website} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Website ↗
              </a>
            )}
            {isOwner && (
              <Link href="/account/business" className="btn-outline">
                Edit listing
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-12 lg:col-span-2">
          {b.offers.length > 0 && (
            <section>
              <h2 className="font-display text-2xl">Special offers</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {b.offers.map((o) => (
                  <OfferCard key={o.id} offer={o} signedIn={!!user} claimed={claimed.has(o.id)} back={back} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-2xl">About</h2>
            <div className="prose-plain mt-3 whitespace-pre-line text-stone-700">{b.description || "No description yet."}</div>
          </section>

          {b.images.length > 0 && (
            <section>
              <h2 className="font-display text-2xl">Gallery</h2>
              <div className="mt-4">
                <Gallery images={b.images} name={b.name} />
              </div>
            </section>
          )}

          <section id="reviews" className="scroll-mt-20">
            <h2 className="font-display text-2xl">Reviews</h2>
            <div className="mt-4 card p-6">
              {!user ? (
                <p className="text-sm text-stone-700">
                  <Link href={`/login?next=${encodeURIComponent(back + "#reviews")}`}>Sign in</Link> or{" "}
                  <Link href={`/register?type=PERSONAL&next=${encodeURIComponent(back + "#reviews")}`}>create a free account</Link> to leave a review.
                </p>
              ) : isOwner ? (
                <p className="text-sm text-stone-600">Owners can’t review their own business.</p>
              ) : (
                <>
                  <h3 className="mb-4 font-semibold">{myReview ? "Update your review" : "Write a review"}</h3>
                  <ReviewForm businessId={b.id} existing={myReview} />
                </>
              )}
            </div>
            <ul className="mt-6 space-y-4">
              {b.reviews.map((r) => (
                <li key={r.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-800">
                        {r.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          r.user.name[0]
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{r.user.name}</p>
                        <p className="text-xs text-stone-500">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <Stars rating={r.rating} size="text-sm" />
                  </div>
                  {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm whitespace-pre-line text-stone-700">{r.body}</p>
                  {(user?.id === r.userId || user?.role === "ADMIN") && (
                    <form action={deleteReview} className="mt-3">
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmButton message="Delete this review?">Delete</ConfirmButton>
                    </form>
                  )}
                </li>
              ))}
              {b.reviews.length === 0 && <li className="text-sm text-stone-600">No reviews yet. Be the first!</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Contact</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {b.phone && (
                <div>
                  <dt className="text-stone-500">Phone</dt>
                  <dd>
                    <a href={`tel:${b.phone}`}>{b.phone}</a>
                  </dd>
                </div>
              )}
              {b.email && (
                <div>
                  <dt className="text-stone-500">Email</dt>
                  <dd>
                    <a href={`mailto:${b.email}`}>{b.email}</a>
                  </dd>
                </div>
              )}
              {b.website && (
                <div>
                  <dt className="text-stone-500">Website</dt>
                  <dd className="truncate">
                    <a href={b.website} target="_blank" rel="noopener noreferrer">
                      {b.website.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
              {b.hours && (
                <div>
                  <dt className="text-stone-500">Hours</dt>
                  <dd className="whitespace-pre-line">{b.hours}</dd>
                </div>
              )}
            </dl>
          </section>
          {address && (
            <section>
              <h2 className="mb-3 font-semibold">Location</h2>
              <MapEmbed address={address} title={b.name} />
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
