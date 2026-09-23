export function Stars({ rating, size = "text-base", showValue }: { rating: number | null; size?: string; showValue?: boolean }) {
  const r = rating ?? 0;
  return (
    <span className={`inline-flex items-center gap-1 ${size}`} aria-label={rating ? `${rating} out of 5 stars` : "No ratings yet"}>
      <span className="relative inline-block leading-none tracking-tight text-stone-300" aria-hidden>
        ★★★★★
        <span className="absolute inset-0 overflow-hidden text-accent-500" style={{ width: `${(r / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
      {showValue && <span className="text-sm font-semibold text-stone-700">{rating ? rating.toFixed(1) : "New"}</span>}
    </span>
  );
}
