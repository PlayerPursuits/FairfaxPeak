import type { Metadata } from "next";
import { listUpcomingEvents } from "@/lib/queries";
import { EventCard } from "@/components/EventCard";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { T } from "@/components/T";

export const metadata: Metadata = { title: "Community Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await listUpcomingEvents();
  const byMonth = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.startsAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    byMonth.set(key, [...(byMonth.get(key) ?? []), e]);
  }
  return (
    <>
      <PageHeader eyebrow={<T k="events.eyebrow">Community calendar</T>} title={<T k="events.title">Upcoming events</T>}>
        <T k="events.intro">Meetings, festivals, clean-ups, and more — posted by Fairfax Peak civic organizations.</T>
      </PageHeader>
      <div className="container-page max-w-3xl py-10">
        {events.length === 0 && <EmptyState title="No upcoming events">Check back soon.</EmptyState>}
        {[...byMonth].map(([month, list]) => (
          <section key={month} className="mb-10">
            <h2 className="mb-4 font-display text-2xl">{month}</h2>
            <div className="space-y-4">
              {list.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
