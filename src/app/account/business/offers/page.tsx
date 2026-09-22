import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deleteOffer, endOffer } from "@/app/actions/business";
import { ConfirmButton } from "@/components/form";
import { EmptyState } from "@/components/PageHeader";
import { formatDate } from "@/lib/utils";
import { Notice } from "../../Section";

export const metadata: Metadata = { title: "Coupons & offers" };

function status(o: { startsAt: Date; endsAt: Date | null }, now: Date) {
  if (o.startsAt > now) return { label: "Scheduled", cls: "bg-sky-100 text-sky-800" };
  if (o.endsAt && o.endsAt < now) return { label: "Expired", cls: "bg-stone-100 text-stone-600" };
  return { label: "Live", cls: "bg-pine-100 text-pine-800" };
}

export default async function OffersDashboard({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireRole("BUSINESS", "/account/business/offers");
  const b = await db.business.findUnique({
    where: { ownerId: user.id },
    include: { offers: { orderBy: { createdAt: "desc" }, include: { _count: { select: { claims: true } } } } },
  });
  if (!b) redirect("/account");
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Coupons & offers</h1>
        <Link href="/account/business/offers/new" className="btn-primary">
          + New offer
        </Link>
      </div>
      {saved && <Notice>Offer saved.</Notice>}
      {b.subscriptionStatus !== "ACTIVE" && (
        <Notice tone="warn">
          Offers are only shown publicly while your membership is active. <Link href="/account/billing">Manage membership</Link>
        </Notice>
      )}
      {b.offers.length === 0 ? (
        <EmptyState title="No offers yet">Create a coupon or special to feature on the Fairfax Peak home page.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {b.offers.map((o) => {
            const s = status(o, now);
            return (
              <li key={o.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                    {o.exclusive && <span className="badge bg-pine-700 text-white">Members only</span>}
                    {o.discount && <span className="badge bg-sun-100 text-pine-900">{o.discount}</span>}
                  </div>
                  <p className="mt-1 font-semibold">{o.title}</p>
                  <p className="text-xs text-stone-500">
                    From {formatDate(o.startsAt)}
                    {o.endsAt ? ` to ${formatDate(o.endsAt)}` : " · no expiry"}
                    {o.exclusive && ` · ${o._count.claims} claimed`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/account/business/offers/${o.id}`} className="btn-outline btn-sm">
                    Edit
                  </Link>
                  {s.label === "Live" && (
                    <form action={endOffer}>
                      <input type="hidden" name="id" value={o.id} />
                      <ConfirmButton message="End this offer now?" className="btn-outline btn-sm">
                        End now
                      </ConfirmButton>
                    </form>
                  )}
                  <form action={deleteOffer}>
                    <input type="hidden" name="id" value={o.id} />
                    <ConfirmButton message="Delete this offer permanently?">Delete</ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
