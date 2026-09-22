"use client";

import { useEffect, useState } from "react";

type Image = { id: string; url: string; caption: string | null };

export function Gallery({ images, name }: { images: Image[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (images.length === 0) return null;
  const current = open !== null ? images[open] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? `${name} photo ${i + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
          </button>
        ))}
      </div>
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.caption ?? name} className="max-h-[80vh] rounded-xl object-contain" />
            <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white">
              <span>{current.caption}</span>
              <span className="flex gap-2">
                <button className="btn-outline btn-sm" onClick={() => setOpen((open! - 1 + images.length) % images.length)}>
                  ‹ Prev
                </button>
                <button className="btn-outline btn-sm" onClick={() => setOpen((open! + 1) % images.length)}>
                  Next ›
                </button>
                <button className="btn-accent btn-sm" onClick={() => setOpen(null)}>
                  Close
                </button>
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
