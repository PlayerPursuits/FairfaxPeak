import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deleteGalleryImage, updateBusinessProfile, updateGalleryImage, uploadGalleryImages } from "@/app/actions/business";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/form";
import { AddressFields } from "@/components/AddressFields";
import { ImageInput } from "@/components/ImageInput";
import { Notice, Section } from "../Section";

export const metadata: Metadata = { title: "Business profile" };

export default async function BusinessDashboard() {
  const user = await requireRole("BUSINESS", "/account/business");
  const [b, categories] = await Promise.all([
    db.business.findUnique({ where: { ownerId: user.id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!b) redirect("/account");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{b.name}</h1>
        <Link href={`/business/${b.slug}`} className="btn-outline btn-sm">
          View public listing →
        </Link>
      </div>
      {b.subscriptionStatus !== "ACTIVE" && (
        <Notice tone="warn">
          Your listing is not public yet. <Link href="/account/billing">Activate your membership</Link> to appear in the directory.
        </Notice>
      )}

      <Section title="Business details" description="This information appears on your public profile.">
        <ActionForm action={updateBusinessProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-brand-700 text-xl text-white">
              {b.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                b.name[0]
              )}
            </div>
            <ImageInput name="logo" label="Logo" className="flex-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Business name" defaultValue={b.name} required />
            <Field as="select" name="categoryId" label="Category" defaultValue={b.categoryId ?? ""}>
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </Field>
          </div>
          <Field name="tagline" label="Tagline" defaultValue={b.tagline ?? ""} maxLength={160} hint="One line shown on directory cards" />
          <Field as="textarea" name="description" label="Overview" rows={7} defaultValue={b.description} hint="Tell neighbors what you do, what makes you special, and your story." />

          <h3 className="pt-2 font-semibold">Contact information</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="phone" label="Phone" type="tel" defaultValue={b.phone ?? ""} />
            <Field name="email" label="Public email" type="email" defaultValue={b.email ?? ""} />
            <Field name="website" label="Website" defaultValue={b.website ?? ""} placeholder="www.example.com" />
          </div>
          <Field as="textarea" name="hours" label="Hours" rows={4} defaultValue={b.hours ?? ""} placeholder={"Mon–Fri 9am–6pm\nSat 10am–4pm\nSun closed"} />

          <h3 className="pt-2 font-semibold">Location</h3>
          <p className="-mt-2 text-xs text-stone-500">Used for the map and “Get directions” button on your profile.</p>
          <AddressFields value={b} />
          <SubmitButton>Save business profile</SubmitButton>
        </ActionForm>
      </Section>

      <Section title="Image gallery" description={`${b.images.length} of 24 images · JPG, PNG, WebP or GIF up to 5 MB each`}>
        <ActionForm action={uploadGalleryImages} className="mb-6 flex flex-wrap items-end gap-3" resetOnSuccess>
          <ImageInput name="images" label="Add photos" multiple className="flex-1" />
          <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
        </ActionForm>
        {b.images.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {b.images.map((img) => (
              <li key={img.id} className="overflow-hidden rounded-xl border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.caption ?? ""} className="aspect-[4/3] w-full object-cover" />
                <div className="space-y-2 p-3">
                  <form action={updateGalleryImage} className="flex gap-2">
                    <input type="hidden" name="id" value={img.id} />
                    <input name="caption" defaultValue={img.caption ?? ""} placeholder="Caption" aria-label="Caption" className="input py-1.5 text-xs" />
                    <button className="btn-outline btn-sm">Save</button>
                  </form>
                  <form action={deleteGalleryImage}>
                    <input type="hidden" name="id" value={img.id} />
                    <ConfirmButton message="Remove this image?">Remove</ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-600">No photos yet. Listings with photos get far more attention!</p>
        )}
      </Section>
    </div>
  );
}
