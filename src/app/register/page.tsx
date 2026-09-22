import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { RegisterForm } from "./RegisterForm";
import type { Role } from "@/lib/constants";

export const metadata: Metadata = { title: "Join" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string; next?: string }> }) {
  const { type, next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, icon: true } });
  const initialType: Role = type === "BUSINESS" || type === "CIVIC" ? type : "PERSONAL";

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-2xl p-8">
        <h1 className="font-display text-3xl font-semibold">Join Fairfax Peak</h1>
        <p className="mt-1 mb-6 text-sm text-stone-600">
          Browsing is always free and open. An account lets you review, claim members-only offers, or list your organization.
        </p>
        <RegisterForm initialType={initialType} categories={categories} next={next} />
        <p className="mt-6 text-center text-sm text-stone-600">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
