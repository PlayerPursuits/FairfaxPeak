import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { changePassword, updateNewsletter, updateProfile } from "@/app/actions/profile";
import { deleteReview } from "@/app/actions/reviews";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/form";
import { AddressFields } from "@/components/AddressFields";
import { ImageInput } from "@/components/ImageInput";
import { Stars } from "@/components/Stars";
import { formatDate } from "@/lib/utils";
import { Notice, Section } from "./Section";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const session = await requireUser("/account");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      reviews: { include: { business: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" } },
      offerClaims: {
        include: { offer: { include: { business: { select: { name: true, slug: true } } } } },
        orderBy: { claimedAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">My account</h1>
      {welcome && <Notice>Welcome to Fairfax Peak, {user.name.split(" ")[0]}! Your account is ready.</Notice>}

      <Section title="Profile" description="Only your name and email are required. Your name appears on reviews you write.">
        <ActionForm action={updateProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>
            <ImageInput name="avatar" label="Profile photo" className="flex-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Name" defaultValue={user.name} required autoComplete="name" />
            <Field name="email" label="Email" type="email" defaultValue={user.email} required autoComplete="email" />
            <Field name="phone" label="Phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" />
          </div>
          <AddressFields value={user} />
          <Field as="textarea" name="bio" label="About you" rows={3} defaultValue={user.bio ?? ""} />
          <SubmitButton>Save profile</SubmitButton>
        </ActionForm>
      </Section>

      <Section title="Newsletter" description="A digest of new offers, new businesses, and upcoming events in Fairfax Peak.">
        <ActionForm action={updateNewsletter} className="flex flex-wrap items-end gap-3">
          <Field as="select" name="newsletter" label="Frequency" defaultValue={user.newsletter} className="min-w-48">
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="NONE">Off</option>
          </Field>
          <SubmitButton>Update</SubmitButton>
        </ActionForm>
      </Section>

      <Section title="Claimed offers" description="Members-only offers you’ve unlocked. Show the code in store.">
        {user.offerClaims.length ? (
          <ul className="divide-y divide-stone-100">
            {user.offerClaims.map(({ offer }) => (
              <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{offer.title}</p>
                  <Link href={`/business/${offer.business.slug}`} className="text-sm">
                    {offer.business.name}
                  </Link>
                  {offer.endsAt && <span className="text-xs text-stone-500"> · ends {formatDate(offer.endsAt)}</span>}
                </div>
                {offer.code && <code className="rounded-lg bg-brand-50 px-3 py-1 font-mono font-bold text-brand-900">{offer.code}</code>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">
            No claimed offers yet. <Link href="/offers?filter=members">Browse members-only offers →</Link>
          </p>
        )}
      </Section>

      <Section title="My reviews">
        {user.reviews.length ? (
          <ul className="divide-y divide-stone-100">
            {user.reviews.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <Link href={`/business/${r.business.slug}#reviews`} className="font-medium">
                    {r.business.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} size="text-sm" />
                    <span className="text-xs text-stone-500">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">{r.body}</p>
                </div>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message="Delete this review?">Delete</ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">
            You haven’t written any reviews. <Link href="/directory">Find a business to review →</Link>
          </p>
        )}
      </Section>

      <Section title="Password">
        <ActionForm action={changePassword} className="grid gap-4 sm:grid-cols-3 sm:items-end" resetOnSuccess>
          <Field name="current" label="Current password" type="password" autoComplete="current-password" />
          <Field name="password" label="New password" type="password" autoComplete="new-password" />
          <SubmitButton>Change password</SubmitButton>
        </ActionForm>
      </Section>
    </div>
  );
}
