import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Unsubscribe" };
export const dynamic = "force-dynamic";

async function unsubscribe(formData: FormData) {
  "use server";
  const userId = await verifyUnsubscribeToken(String(formData.get("token") ?? ""));
  if (userId) await db.user.update({ where: { id: userId }, data: { newsletter: "NONE" } }).catch(() => {});
  redirect(`/unsubscribe?done=${userId ? 1 : 0}`);
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token, done } = await searchParams;
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        {done === "1" ? (
          <>
            <h1 className="font-display text-2xl font-semibold">You’re unsubscribed</h1>
            <p className="mt-2 text-sm text-stone-600">You won’t receive the Fairfax Peak newsletter anymore.</p>
            <Link href="/account" className="btn-outline mt-6">
              Manage preferences
            </Link>
          </>
        ) : done === "0" || !token ? (
          <>
            <h1 className="font-display text-2xl font-semibold">Link expired or invalid</h1>
            <p className="mt-2 text-sm text-stone-600">Sign in to change your newsletter preferences.</p>
            <Link href="/account" className="btn-primary mt-6">
              Go to my account
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">Unsubscribe from the newsletter?</h1>
            <form action={unsubscribe} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button className="btn-primary">Yes, unsubscribe me</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
