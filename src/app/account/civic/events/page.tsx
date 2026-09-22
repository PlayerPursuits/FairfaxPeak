import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deleteEvent } from "@/app/actions/civic";
import { ConfirmButton } from "@/components/form";
import { EmptyState } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/utils";
import { Notice } from "../../Section";

export const metadata: Metadata = { title: "Events" };

export default async function CivicEvents({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requireRole("CIVIC", "/account/civic/events");
  const events = await db.event.findMany({ where: { org: { ownerId: user.id } }, orderBy: { startsAt: "desc" } });
  const now = new Date();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Events</h1>
        <Link href="/account/civic/events/new" className="btn-primary">
          + New event
        </Link>
      </div>
      {saved && <Notice>Event saved.</Notice>}
      {events.length === 0 ? (
        <EmptyState title="No events yet">Events appear on the community calendar, your page, and the resident newsletter.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">
                  {e.title} {(e.endsAt ?? e.startsAt) < now && <span className="badge bg-stone-100 text-stone-600">Past</span>}
                </p>
                <p className="text-sm text-stone-600">
                  {formatDateTime(e.startsAt)}
                  {e.location && ` · ${e.location}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/account/civic/events/${e.id}`} className="btn-outline btn-sm">
                  Edit
                </Link>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmButton message="Delete this event?">Delete</ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
