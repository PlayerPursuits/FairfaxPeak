import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deleteResource } from "@/app/actions/civic";
import { ConfirmButton } from "@/components/form";
import { EmptyState } from "@/components/PageHeader";
import { Notice } from "../../Section";

export const metadata: Metadata = { title: "Resources" };

export default async function CivicResources({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireRole("CIVIC", "/account/civic/resources");
  const resources = await db.resource.findMany({ where: { org: { ownerId: user.id } }, orderBy: [{ category: "asc" }, { title: "asc" }] });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Resources</h1>
        <Link href="/account/civic/resources/new" className="btn-primary">
          + New resource
        </Link>
      </div>
      {saved && <Notice>Resource saved.</Notice>}
      {resources.length === 0 ? (
        <EmptyState title="No resources yet">Share services, forms, and links that help residents.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {resources.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                {r.category && <p className="text-xs font-semibold text-brand-600 uppercase">{r.category}</p>}
                <p className="font-semibold">{r.title}</p>
                {r.url && <p className="truncate text-xs text-stone-500">{r.url}</p>}
              </div>
              <div className="flex gap-2">
                <Link href={`/account/civic/resources/${r.id}`} className="btn-outline btn-sm">
                  Edit
                </Link>
                <form action={deleteResource}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message="Delete this resource?">Delete</ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
