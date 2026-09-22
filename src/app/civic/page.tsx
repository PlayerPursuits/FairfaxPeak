import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Civic & Local Government" };
export const dynamic = "force-dynamic";

export default async function CivicPage() {
  const orgs = await db.civicOrg.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { events: { where: { startsAt: { gte: new Date() } } }, resources: true } } },
  });
  return (
    <>
      <PageHeader eyebrow="Civic & local government" title="Community organizations">
        Local government offices, schools, libraries, and civic groups serving Fairfax Peak.
      </PageHeader>
      <div className="container-page py-10">
        {orgs.length === 0 ? (
          <EmptyState title="No organizations yet" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((o) => (
              <Link key={o.id} href={`/civic/${o.slug}`} className="card flex gap-4 p-5 text-inherit no-underline hover:border-pine-300 hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-pine-100 text-2xl">
                  {o.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🏛️"
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold">{o.name}</h2>
                  {o.orgType && <p className="text-xs text-stone-500">{o.orgType}</p>}
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">{o.overview}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    {o._count.events} upcoming event{o._count.events === 1 ? "" : "s"} · {o._count.resources} resource{o._count.resources === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
