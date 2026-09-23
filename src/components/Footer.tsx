import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer className="mt-20 bg-fp-ink text-stone-300">
      <div className="h-1 bg-gradient-to-r from-fp-green via-fp-cyan to-fp-blue" aria-hidden />
      <div className="container-page grid gap-8 py-12 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="flex items-center gap-3">
            <BrandMark className="h-9 w-auto" />
            <span className="font-display text-2xl tracking-[0.12em] text-white uppercase">{SITE_NAME}</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-stone-300">
            The hyper-local guide to the businesses, organizations, and neighbors that make {SITE_NAME} home.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["/directory", "Business directory"],
              ["/offers", "Special offers"],
              ["/events", "Community events"],
              ["/resources", "Local resources"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-stone-300 no-underline hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Join</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["/register?type=PERSONAL", "Residents (free)"],
              ["/register?type=BUSINESS", "List your business"],
              ["/register?type=CIVIC", "Civic organizations (free)"],
              ["/account", "My account"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-stone-300 no-underline hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} {SITE_NAME}. Made for neighbors, by neighbors.
      </div>
    </footer>
  );
}
