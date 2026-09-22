import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

type Event = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  url: string | null;
  startsAt: Date;
  endsAt: Date | null;
  org?: { name: string; slug: string };
};

export function EventCard({ e, compact }: { e: Event; compact?: boolean }) {
  const d = new Date(e.startsAt);
  return (
    <article className="card flex gap-4 p-4">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-pine-700 text-white">
        <span className="text-xs font-semibold uppercase">{d.toLocaleDateString("en-US", { month: "short" })}</span>
        <span className="font-display text-2xl leading-none font-bold">{d.getDate()}</span>
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold">{e.title}</h3>
        <p className="text-sm text-stone-600">
          {formatDateTime(e.startsAt)}
          {e.location && <> · {e.location}</>}
        </p>
        {e.org && (
          <Link href={`/civic/${e.org.slug}`} className="text-xs font-medium hover:underline">
            {e.org.name}
          </Link>
        )}
        {!compact && <p className="mt-2 text-sm whitespace-pre-line text-stone-600">{e.description}</p>}
        {!compact && e.url && (
          <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium">
            Event details ↗
          </a>
        )}
      </div>
    </article>
  );
}
