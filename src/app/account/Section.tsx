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
      className={`rounded-xl border px-4 py-3 text-sm ${tone === "success" ? "border-pine-200 bg-pine-50 text-pine-800" : "border-sun-300 bg-sun-100 text-pine-900"}`}
    >
      {children}
    </p>
  );
}
