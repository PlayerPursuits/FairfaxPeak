import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { updateCivicProfile } from "@/app/actions/civic";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { AddressFields } from "@/components/AddressFields";
import { ImageInput } from "@/components/ImageInput";
import { ContactsRepeater } from "@/components/ContactsRepeater";
import { Notice, Section } from "../Section";

export const metadata: Metadata = { title: "Organization profile" };

export default async function CivicDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await requireRole("CIVIC", "/account/civic");
  const org = await db.civicOrg.findUnique({
    where: { ownerId: user.id },
    include: {
      contacts: { orderBy: { sortOrder: "asc" } },
      _count: { select: { events: { where: { startsAt: { gte: new Date() } } }, resources: true } },
    },
  });
  if (!org) redirect("/account");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{org.name}</h1>
        <Link href={`/civic/${org.slug}`} className="btn-outline btn-sm">
          View public page →
        </Link>
      </div>
      {welcome && <Notice>Welcome! Your civic organization is listed for free. Complete your profile below.</Notice>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/civic/events" className="card p-5 text-inherit no-underline hover:border-brand-300">
          <p className="text-3xl font-bold text-brand-700">{org._count.events}</p>
          <p className="text-sm text-stone-600">Upcoming events · Manage →</p>
        </Link>
        <Link href="/account/civic/resources" className="card p-5 text-inherit no-underline hover:border-brand-300">
          <p className="text-3xl font-bold text-brand-700">{org._count.resources}</p>
          <p className="text-sm text-stone-600">Resources · Manage →</p>
        </Link>
      </div>

      <ActionForm action={updateCivicProfile} className="space-y-6">
        <Section title="Organization overview">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-2xl">
                {org.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  "🏛️"
                )}
              </div>
              <ImageInput name="logo" label="Logo / seal" className="flex-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Organization name" defaultValue={org.name} required />
              <Field name="orgType" label="Type" defaultValue={org.orgType ?? ""} placeholder="e.g. Town government, Library, School district" />
            </div>
            <Field as="textarea" name="overview" label="Overview" rows={6} defaultValue={org.overview} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field name="website" label="Website" defaultValue={org.website ?? ""} />
              <Field name="email" label="General email" type="email" defaultValue={org.email ?? ""} />
              <Field name="phone" label="General phone" type="tel" defaultValue={org.phone ?? ""} />
            </div>
          </div>
        </Section>

        <Section title="Points of contact" description="Add as many contacts as you need. They’re shown in this order on your public page.">
          <ContactsRepeater initial={org.contacts} />
        </Section>

        <Section title="Location" description="Shown on a map with directions on your public page.">
          <AddressFields value={org} />
        </Section>

        <SubmitButton>Save organization profile</SubmitButton>
      </ActionForm>
    </div>
  );
}
