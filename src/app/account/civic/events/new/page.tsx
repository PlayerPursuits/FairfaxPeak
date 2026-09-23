import Link from "next/link";
import { requireRole } from "@/lib/session";
import { EventForm } from "../EventForm";
import { Section } from "../../../Section";

export default async function NewEvent() {
  await requireRole("CIVIC", "/account/civic/events/new");
  return (
    <div className="space-y-4">
      <Link href="/account/civic/events" className="text-sm">
        ← Back to events
      </Link>
      <Section title="New event">
        <EventForm />
      </Section>
    </div>
  );
}
