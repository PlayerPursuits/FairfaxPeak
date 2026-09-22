import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-6xl text-brand-700">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 text-stone-600">It may have moved, or the listing is no longer active.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/directory" className="btn-outline">
          Browse the directory
        </Link>
      </div>
    </div>
  );
}
