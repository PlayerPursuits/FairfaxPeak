import Link from "next/link";
import { requireUser } from "@/lib/session";

const LINKS: Record<string, { href: string; label: string }[]> = {
  PERSONAL: [{ href: "/account", label: "Profile & newsletter" }],
  BUSINESS: [
    { href: "/account/business", label: "Business profile" },
    { href: "/account/business/offers", label: "Coupons & offers" },
    { href: "/account/billing", label: "Membership & billing" },
    { href: "/account", label: "My account" },
  ],
  CIVIC: [
    { href: "/account/civic", label: "Organization profile" },
    { href: "/account/civic/events", label: "Events" },
    { href: "/account/civic/resources", label: "Resources" },
    { href: "/account", label: "My account" },
  ],
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const links = LINKS[user.role] ?? LINKS.PERSONAL;
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-4">
      <aside>
        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Signed in as</p>
        <p className="font-semibold">{user.name}</p>
        <p className="mb-4 truncate text-sm text-stone-500">{user.email}</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Account">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm whitespace-nowrap text-stone-700 no-underline hover:bg-pine-50 hover:text-pine-700">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 lg:col-span-3">{children}</div>
    </div>
  );
}
