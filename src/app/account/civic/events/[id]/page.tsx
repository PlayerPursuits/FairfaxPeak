import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EventForm } from "../EventForm";
import { Section } from "../../../Section";

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("CIVIC", `/account/civic/events/${id}`);
  const event = await db.event.findFirst({ where: { id, org: { ownerId: user.id } } });
  if (!event) notFound();
  return (
    <div className="space-y-4">
      <Link href="/account/civic/events" className="text-sm">
        ← Back to events
      </Link>
      <Section title="Edit event">
        <EventForm event={event} />
      </Section>
    </div>
  );
}
