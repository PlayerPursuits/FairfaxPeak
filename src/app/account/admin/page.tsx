import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { DEMO_LOGINS } from "@/lib/demo";
import { loadDemo, removeDemo } from "@/app/actions/admin";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/form";
import { Notice, Section } from "../Section";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ done?: string; count?: string }> }) {
  const { done, count } = await searchParams;
  await requireRole("ADMIN", "/account/admin");
  const [demo, byRole, activeBusinesses, offers, events] = await Promise.all([
    db.user.count({ where: { isDemo: true } }),
    db.user.groupBy({ by: ["role"], where: { isDemo: false }, _count: true }),
    db.business.count({ where: { subscriptionStatus: "ACTIVE", owner: { isDemo: false } } }),
    db.offer.count({ where: { business: { owner: { isDemo: false } } } }),
    db.event.count({ where: { org: { owner: { isDemo: false } } } }),
  ]);
  const roleCount = (r: string) => byRole.find((x) => x.role === r)?._count ?? 0;
  const stats = [
    ["Residents", roleCount("PERSONAL")],
    ["Business owners", roleCount("BUSINESS")],
    ["Active listings", activeBusinesses],
    ["Civic orgs", roleCount("CIVIC")],
    ["Offers", offers],
    ["Events", events],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Admin</h1>
      {done === "loaded" && <Notice>Demo data loaded. Sign in to the demo accounts below with the password you chose.</Notice>}
      {done === "removed" && <Notice>Removed {count ?? 0} demo accounts and everything they created.</Notice>}

      <Section title="Real members" description="Counts exclude demo accounts.">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map(([label, n]) => (
            <div key={label} className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs text-stone-500 uppercase">{label}</dt>
              <dd className="text-2xl font-bold text-brand-700">{n}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        title="Demo data"
        description="Fictional residents, businesses (with offers, photos and reviews) and civic organizations, for showing the site before real members join. Loading adds to what's there and never deletes anything real."
      >
        {demo === 0 ? (
          <ActionForm action={loadDemo} className="space-y-4">
            <Field
              name="password"
              label="Password for the demo accounts"
              type="text"
              autoComplete="off"
              hint="Anyone who knows it can sign in to the demo accounts, so don't reuse a real password."
              required
            />
            <SubmitButton pendingText="Loading demo data…">Load demo data</SubmitButton>
          </ActionForm>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-stone-700">
              <strong>{demo} demo accounts</strong> are loaded. Sign in to them with the password you chose:
            </p>
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
              {DEMO_LOGINS.map((l) => (
                <li key={l.email} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                  <span className="text-stone-500">{l.role}</span>
                  <code className="font-mono">{l.email}</code>
                </li>
              ))}
            </ul>
            <ActionForm action={removeDemo}>
              <p className="mb-3 text-sm text-stone-600">
                Remove all demo accounts before launch. This deletes their listings, offers, photos, reviews, events and resources. Real members aren’t affected, but reviews real members left on demo businesses are deleted with them.
              </p>
              <ConfirmButton message="Remove all demo data? This can't be undone." className="btn-danger">
                Remove demo data
              </ConfirmButton>
            </ActionForm>
          </div>
        )}
      </Section>
    </div>
  );
}
