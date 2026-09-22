import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { listBusinesses } from "@/lib/queries";
import { BusinessCard } from "@/components/BusinessCard";
import { EmptyState, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Business Directory" };
export const dynamic = "force-dynamic";

export default async function Directory({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q, category } = await searchParams;
  const [categories, businesses] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    listBusinesses({ q: q?.trim() || undefined, category }),
  ]);
  const active = categories.find((c) => c.slug === category);

  return (
    <>
      <PageHeader eyebrow="Business directory" title={active ? `${active.icon} ${active.name}` : "Find local businesses"}>
        Every business here is a member of the Fairfax Peak community.
      </PageHeader>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-4">
        <aside className="space-y-6">
          <form className="space-y-2">
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="q" className="label">
              Search
            </label>
            <div className="flex gap-2">
              <input id="q" name="q" defaultValue={q} placeholder="Name or keyword" className="input" />
              <button className="btn-primary btn-sm">Go</button>
            </div>
          </form>
          <nav aria-label="Categories">
            <p className="label">Categories</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={q ? `/directory?q=${encodeURIComponent(q)}` : "/directory"}
                  className={`block rounded-lg px-3 py-2 text-sm no-underline ${!category ? "bg-pine-700 text-white" : "text-stone-700 hover:bg-pine-50"}`}
                >
                  All categories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/directory?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    className={`block rounded-lg px-3 py-2 text-sm no-underline ${category === c.slug ? "bg-pine-700 text-white" : "text-stone-700 hover:bg-pine-50"}`}
                  >
                    {c.icon} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section className="lg:col-span-3">
          <p className="mb-4 text-sm text-stone-600">
            {businesses.length} business{businesses.length === 1 ? "" : "es"}
            {q && (
              <>
                {" "}
                matching “<strong>{q}</strong>”
              </>
            )}
          </p>
          {businesses.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {businesses.map((b) => (
                <BusinessCard key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <EmptyState title="No businesses found">
              Try a different search or <Link href="/directory">browse all categories</Link>.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
