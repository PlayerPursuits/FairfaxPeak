import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/") ? next : "/account");
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-1 text-sm text-stone-600">Sign in to your Fairfax Peak account.</p>
        <ActionForm action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <Field name="email" label="Email" type="email" autoComplete="email" required />
          <Field name="password" label="Password" type="password" autoComplete="current-password" required />
          <SubmitButton pendingText="Signing in…" className="btn-primary w-full">
            Sign in
          </SubmitButton>
        </ActionForm>
        <p className="mt-6 text-center text-sm text-stone-600">
          New here? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
