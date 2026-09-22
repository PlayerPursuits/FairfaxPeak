import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { SITE_NAME } from "@/lib/constants";

const NAV = [
  { href: "/directory", label: "Directory" },
  { href: "/offers", label: "Offers" },
  { href: "/events", label: "Events" },
  { href: "/civic", label: "Civic" },
  { href: "/resources", label: "Resources" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-pine-800 no-underline">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <circle cx="16" cy="16" r="16" className="fill-pine-700" />
        <circle cx="22" cy="10" r="3.5" className="fill-sun-400" />
        <path d="M4 25 L13 12 L18 19 L21 15 L28 25 Z" className="fill-pine-100" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">{SITE_NAME}</span>
    </Link>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-medium text-stone-700 no-underline hover:bg-pine-50 hover:text-pine-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/account" className="btn-outline btn-sm hidden sm:inline-flex">
                {user.name.split(" ")[0]}’s account
              </Link>
              <form action={logout}>
                <button className="btn-sm btn text-stone-600 hover:text-pine-700">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-sm btn text-stone-700 no-underline hover:text-pine-700">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary btn-sm">
                Join free
              </Link>
            </>
          )}
          <details className="relative md:hidden">
            <summary className="btn-outline btn-sm cursor-pointer list-none" aria-label="Menu">
              ☰
            </summary>
            <nav className="card absolute right-0 mt-2 flex w-48 flex-col p-2" aria-label="Mobile">
              {[...NAV, ...(user ? [{ href: "/account", label: "My account" }] : [])].map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-stone-700 no-underline hover:bg-pine-50">
                  {n.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
