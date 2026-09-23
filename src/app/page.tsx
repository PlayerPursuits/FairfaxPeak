import Link from "next/link";
import { db } from "@/lib/db";
import { getCommunity } from "@/lib/community";
import { getCurrentUser } from "@/lib/session";
import { claimedOfferIds, listBusinesses, listLiveOffers, listUpcomingEvents } from "@/lib/queries";
import { OfferCard } from "@/components/OfferCard";
import { BusinessCard } from "@/components/BusinessCard";
import { EventCard } from "@/components/EventCard";
import { BrandMark } from "@/components/BrandMark";
import { T } from "@/components/T";
import { EditableText } from "@/components/EditableText";
import { isEditingText } from "@/lib/site-text";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [community, user, editing] = await Promise.all([getCommunity(), getCurrentUser(), isEditingText()]);
  const [offers, highlights, categories, newest, events, claimed] = await Promise.all([
    listLiveOffers(6),
    db.areaHighlight.findMany({ where: { communityId: community.id }, orderBy: { sortOrder: "asc" } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { businesses: { where: { subscriptionStatus: "ACTIVE" } } } } } }),
    listBusinesses({ take: 4, orderBy: "newest" }),
    listUpcomingEvents(4),
    claimedOfferIds(user?.id),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white">
        {community.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={community.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
        )}
        <BrandMark className="pointer-events-none absolute -right-24 -bottom-10 hidden h-[26rem] w-auto opacity-25 md:block lg:right-0" />
        <div className="relative container-page py-20 sm:py-28">
          <p className="text-sm font-semibold tracking-widest text-accent-300 uppercase"><T k="home.hero.eyebrow">Welcome to</T></p>
          <h1 className="mt-2 font-display text-5xl tracking-[0.06em] text-white uppercase sm:text-7xl">{community.name}</h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            {editing ? <EditableText target={{ kind: "community", field: "tagline" }} value={community.tagline} /> : community.tagline}
          </p>
          <form action="/directory" className="mt-8 flex max-w-xl gap-2 rounded-full bg-white p-1.5 shadow-lg">
            <label htmlFor="hero-q" className="sr-only">
              Search local businesses
            </label>
            <input
              id="hero-q"
              name="q"
              placeholder="Search coffee, plumbers, dentists…"
              className="min-w-0 flex-1 rounded-full px-4 text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
            <button className="btn-accent"><T k="home.hero.search">Search</T></button>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/directory?category=${c.slug}`} className="badge bg-white/15 px-3 py-1.5 text-sm text-white no-underline hover:bg-white/25">
                {c.icon} {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent offers */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase"><T k="home.offers.eyebrow">Fresh deals</T></p>
            <h2 className="font-display text-3xl"><T k="home.offers.title">Recently added special offers</T></h2>
          </div>
          <Link href="/offers" className="hidden text-sm font-semibold sm:block">
            <T k="home.offers.link">All offers →</T>
          </Link>
        </div>
        {offers.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} signedIn={!!user} claimed={claimed.has(o.id)} back="/" />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-stone-600"><T k="home.offers.empty">No offers yet — check back soon!</T></p>
        )}
        {!user && (
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-accent-100 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-brand-900"><T k="home.join.title">Unlock members-only offers</T></p>
              <p className="text-sm text-stone-700"><T k="home.join.body">Create a free resident account to claim exclusive deals and leave reviews.</T></p>
            </div>
            <Link href="/register?type=PERSONAL" className="btn-primary">
              <T k="home.join.button">Join free</T>
            </Link>
          </div>
        )}
      </section>

      {/* About the area */}
      <section className="bg-white py-14">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase"><T k="home.about.eyebrow">About the area</T></p>
              <h2 className="font-display text-3xl"><T k="home.about.title">Life in Fairfax Peak</T></h2>
              {(() => {
                const paragraphs = (
                  <div className="prose-plain mt-4 text-stone-600">
                    {community.description.split(/\n\n+/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                );
                return editing ? (
                  <EditableText target={{ kind: "community", field: "description" }} value={community.description} multiline block>
                    {paragraphs}
                  </EditableText>
                ) : (
                  paragraphs
                );
              })()}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
              {highlights.map((h) => (
                <article key={h.id} className="card overflow-hidden">
                  {h.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.imageUrl} alt="" className="h-32 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold">
                      {editing ? <EditableText target={{ kind: "highlight", id: h.id, field: "title" }} value={h.title} /> : h.title}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {editing ? <EditableText target={{ kind: "highlight", id: h.id, field: "body" }} value={h.body} multiline /> : h.body}
                    </p>
                    {h.linkUrl && (
                      <Link href={h.linkUrl} className="mt-2 inline-block text-sm font-semibold">
                        <T k="home.about.more">Learn more →</T>
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14">
        <h2 className="font-display text-3xl"><T k="home.categories.title">Browse by category</T></h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/directory?category=${c.slug}`} className="card flex items-center gap-3 p-4 text-inherit no-underline hover:border-brand-300 hover:bg-brand-50">
              <span className="text-2xl">{c.icon}</span>
              <span>
                <span className="block font-semibold">{c.name}</span>
                <span className="text-xs text-stone-500">{c._count.businesses} listed</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New businesses + events */}
      <section className="container-page grid gap-10 pb-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl"><T k="home.newest.title">New in the directory</T></h2>
            <Link href="/directory" className="text-sm font-semibold">
              <T k="home.newest.link">See all →</T>
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {newest.map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl"><T k="home.events.title">Upcoming events</T></h2>
            <Link href="/events" className="text-sm font-semibold">
              <T k="home.events.link">Calendar →</T>
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {events.length ? events.map((e) => <EventCard key={e.id} e={e} compact />) : <p className="text-sm text-stone-600"><T k="home.events.empty">No upcoming events.</T></p>}
          </div>
        </div>
      </section>

      {/* Business CTA */}
      <section className="container-page mt-14">
        <div className="grid gap-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-600 p-8 text-white sm:p-12 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl text-white"><T k="home.cta.title">Own a business in Fairfax Peak?</T></h2>
            <p className="mt-2 text-brand-100">
              <T k="home.cta.body">Get a full profile with photos, reviews, directions, and coupons that reach your neighbors every day — $20/month or $200/year.</T>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/register?type=BUSINESS" className="btn-accent">
              <T k="home.cta.business">List your business</T>
            </Link>
            <Link href="/register?type=CIVIC" className="btn border border-white/40 text-white no-underline hover:bg-white/10">
              <T k="home.cta.civic">Civic orgs join free</T>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
