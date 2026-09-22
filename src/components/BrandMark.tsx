/** Vector version of the Fairfax Peak triangle mark (traced from the brand logo). */
export function BrandMark({ className, mono }: { className?: string; mono?: boolean }) {
  const f = (c: string) => (mono ? "currentColor" : c);
  return (
    <svg viewBox="50 64 412 302" className={className} aria-hidden>
      <g opacity={mono ? 0.9 : 1}>
        <path d="M256 68 305 142 256 212 207 140Z" fill={f("#046399")} opacity={mono ? 0.55 : 1} />
        <path d="M305 142 458 362H360L256 212Z" fill={f("#0077b5")} opacity={mono ? 0.8 : 1} />
        <path d="M207 140 256 212 236 240 187 168Z" fill={f("#11b365")} opacity={mono ? 0.45 : 1} />
        <path d="M187 168 236 240 189 306 140 236Z" fill={f("#008981")} opacity={mono ? 0.65 : 1} />
        <path d="M140 236 189 306 152 362H53Z" fill={f("#11b365")} opacity={mono ? 0.5 : 1} />
        <path d="M236 240 320 362H226L189 306Z" fill={f("#07b9e2")} opacity={mono ? 0.35 : 1} />
      </g>
    </svg>
  );
}
