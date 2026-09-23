import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-stone-200 bg-gradient-to-b from-brand-50 to-stone-25">
      <div className="container-page py-10 sm:py-14">
        {eyebrow && <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-stone-600">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-stone-800">{title}</p>
      {children && <div className="mt-2 text-sm text-stone-600">{children}</div>}
    </div>
  );
}
