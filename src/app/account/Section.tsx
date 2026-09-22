import type { ReactNode } from "react";

export function Section({ title, description, children, actions }: { title: string; description?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-stone-600">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Notice({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "warn" }) {
  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${tone === "success" ? "border-brand-200 bg-brand-50 text-brand-800" : "border-accent-300 bg-accent-100 text-brand-900"}`}
    >
      {children}
    </p>
  );
}
