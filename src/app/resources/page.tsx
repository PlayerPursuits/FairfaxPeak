import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { T } from "@/components/T";

export const metadata: Metadata = { title: "Community Resources" };
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await db.resource.findMany({
    include: { org: { select: { name: true, slug: true } } },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  const groups = new Map<string, typeof resources>();
  for (const r of resources) {
    const k = r.category ?? "Other";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return (
    <>
      <PageHeader eyebrow={<T k="resources.eyebrow">Community resources</T>} title={<T k="resources.title">Local services & information</T>}>
        <T k="resources.intro">Helpful links and services shared by Fairfax Peak civic and government organizations.</T>
      </PageHeader>
      <div className="container-page py-10">
        {resources.length === 0 && <EmptyState title="No resources yet" />}
        {[...groups].map(([category, list]) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 font-display text-2xl">{category}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((r) => (
                <li key={r.id} className="card p-5">
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
                  <Link href={`/civic/${r.org.slug}`} className="mt-3 inline-block text-xs font-medium">
                    {r.org.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
