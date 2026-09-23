import { directionsUrl, mapEmbedUrl } from "@/lib/utils";

export function MapEmbed({ address, title }: { address: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <iframe
        title={`Map of ${title}`}
        src={mapEmbedUrl(address)}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-stone-700">{address}</p>
        <a href={directionsUrl(address)} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
          Get directions ↗
        </a>
      </div>
    </div>
  );
}
