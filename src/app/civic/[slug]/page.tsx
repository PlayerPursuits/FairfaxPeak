import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatAddress } from "@/lib/utils";
import { MapEmbed } from "@/components/MapEmbed";
import { EventCard } from "@/components/EventCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = await db.civicOrg.findUnique({ where: { slug: (await params).slug }, select: { name: true } });
  return o ? { title: o.name } : {};
}

export default async function CivicOrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  const [org, user] = await Promise.all([
    db.civicOrg.findUnique({
      where: { slug },
      include: {
        contacts: { orderBy: { sortOrder: "asc" } },
        events: { where: { OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }] }, orderBy: { startsAt: "asc" } },
        resources: { orderBy: [{ category: "asc" }, { title: "asc" }] },
      },
    }),
    getCurrentUser(),
  ]);
  if (!org) notFound();
  const address = formatAddress(org);

  return (
    <>
      <section className="border-b border-stone-200 bg-white">
        <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-pine-100 text-4xl">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={`${org.name} logo`} className="h-full w-full object-cover" />
            ) : (
              "🏛️"
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-pine-600">{org.orgType ?? "Civic organization"}</p>
            <h1 className="font-display text-4xl font-semibold">{org.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Website ↗
              </a>
            )}
            {user?.id === org.ownerId && (
              <Link href="/account/civic" className="btn-outline">
                Edit profile
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-3">
        <div className="space-y-12 lg:col-span-2">
          <section>
            <h2 className="font-display text-2xl font-semibold">Overview</h2>
            <div className="mt-3 whitespace-pre-line text-stone-700">{org.overview || "No overview yet."}</div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Upcoming events</h2>
            <div className="mt-4 space-y-4">
              {org.events.length ? org.events.map((e) => <EventCard key={e.id} e={e} />) : <p className="text-sm text-stone-600">No upcoming events.</p>}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Resources</h2>
            {org.resources.length ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {org.resources.map((r) => (
                  <li key={r.id} className="card p-4">
                    {r.category && <p className="text-xs font-semibold text-pine-600 uppercase">{r.category}</p>}
                    <p className="font-semibold">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          {r.title} ↗
                        </a>
                      ) : (
                        r.title
                      )}
                    </p>
                    {r.description && <p className="mt-1 text-sm text-stone-600">{r.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-600">No resources listed.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Points of contact</h2>
            <ul className="mt-3 divide-y divide-stone-100">
              {org.contacts.map((c) => (
                <li key={c.id} className="py-3 text-sm first:pt-0 last:pb-0">
                  <p className="font-semibold">{c.name}</p>
                  {c.title && <p className="text-stone-500">{c.title}</p>}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="block">
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="block">
                      {c.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            {(org.email || org.phone) && (
              <div className="mt-4 border-t border-stone-100 pt-4 text-sm">
                <p className="text-stone-500">General inquiries</p>
                {org.email && (
                  <a href={`mailto:${org.email}`} className="block">
                    {org.email}
                  </a>
                )}
                {org.phone && (
                  <a href={`tel:${org.phone}`} className="block">
                    {org.phone}
                  </a>
                )}
              </div>
            )}
          </section>
          {address && (
            <section>
              <h2 className="mb-3 font-semibold">Location</h2>
              <MapEmbed address={address} title={org.name} />
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
