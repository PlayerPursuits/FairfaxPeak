import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { toggleEditMode } from "@/app/actions/site-text";
import { isEditingText } from "@/lib/site-text";
import { T } from "./T";
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
    <Link href="/" className="flex shrink-0 items-center no-underline" aria-label={`${SITE_NAME} home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-horizontal.png" alt={SITE_NAME} width={773} height={114} className="h-6 w-auto sm:h-8" />
    </Link>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const editing = await isEditingText();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="h-1 bg-gradient-to-r from-fp-green via-fp-cyan to-fp-blue" aria-hidden />
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-medium text-stone-700 no-underline hover:bg-brand-50 hover:text-brand-700">
              <T k={`nav${n.href.replace(/\//g, ".")}`}>{n.label}</T>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user?.role === "ADMIN" && (
            <form action={toggleEditMode}>
              <button
                className={`btn-sm btn border ${editing ? "border-fp-cyan bg-fp-cyan/15 text-brand-800" : "border-stone-300 text-stone-600 hover:text-brand-700"}`}
                title="Admins: click outlined text on any page to change it"
              >
                ✎ {editing ? "Editing on" : "Edit text"}
              </button>
            </form>
          )}
          {user ? (
            <>
              <Link href="/account" className="btn-outline btn-sm hidden sm:inline-flex">
                {user.name.split(" ")[0]}’s account
              </Link>
              <form action={logout}>
                <button className="btn-sm btn text-stone-600 hover:text-brand-700">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-sm btn hidden text-stone-700 no-underline hover:text-brand-700 sm:inline-flex">
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
              {[...NAV, user ? { href: "/account", label: "My account" } : { href: "/login", label: "Sign in" }].map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-stone-700 no-underline hover:bg-brand-50">
                  <T k={`nav${n.href.replace(/\//g, ".")}`}>{n.label}</T>
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
