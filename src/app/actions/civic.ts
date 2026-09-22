"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { uniqueSlug } from "@/lib/slugs";
import { normalizeUrl } from "@/lib/utils";
import {
  addressFrom,
  addressShape,
  fieldErrors,
  nullify,
  optionalEmail,
  optionalText,
  optionalUrl,
  str,
  type FormState,
} from "@/lib/forms";
import { deleteImage, imageFromForm, UploadError } from "@/lib/uploads";

async function myOrg() {
  const user = await requireRole("CIVIC", "/account/civic");
  const org = await db.civicOrg.findUnique({ where: { ownerId: user.id } });
  if (!org) redirect("/account");
  return { user, org };
}

function revalidateOrg(slug: string) {
  revalidatePath(`/civic/${slug}`);
  revalidatePath("/civic");
  revalidatePath("/events");
  revalidatePath("/resources");
  revalidatePath("/account/civic");
  revalidatePath("/");
}

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  title: optionalText(100),
  email: optionalEmail,
  phone: optionalText(40),
});

const orgSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(120),
  orgType: optionalText(80),
  overview: z.string().max(5000).optional(),
  website: optionalUrl,
  email: optionalEmail,
  phone: optionalText(40),
  ...addressShape,
});

/** Repeater rows arrive as contacts[0][name], contacts[0][email], ... */
function readContacts(fd: FormData) {
  const rows = new Map<number, Record<string, string | undefined>>();
  for (const [key, value] of fd.entries()) {
    const m = /^contacts\[(\d+)\]\[(name|title|email|phone)\]$/.exec(key);
    if (!m || typeof value !== "string") continue;
    const i = Number(m[1]);
    const row = rows.get(i) ?? {};
    row[m[2]] = value.trim() || undefined;
    rows.set(i, row);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, r]) => r);
}

/** Validate repeater rows, skipping blank ones but keeping error paths aligned with form indexes. */
function validateContacts(rows: Record<string, string | undefined>[]) {
  const contacts: z.infer<typeof contactSchema>[] = [];
  const errors: Record<string, string> = {};
  rows.forEach((row, i) => {
    if (!row.name && !row.title && !row.email && !row.phone) return;
    const r = contactSchema.safeParse(row);
    if (r.success) contacts.push(r.data);
    else for (const issue of r.error.issues) errors[`contacts.${i}.${issue.path.join(".")}`] ??= issue.message;
  });
  return { contacts, errors };
}

export async function updateCivicProfile(_: FormState, fd: FormData): Promise<FormState> {
  const { org } = await myOrg();
  const parsed = orgSchema.safeParse({
    name: str(fd, "name"),
    orgType: str(fd, "orgType"),
    overview: str(fd, "overview"),
    website: str(fd, "website"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    ...addressFrom(fd),
  });
  const { contacts, errors } = validateContacts(readContacts(fd));
  if (!parsed.success) {
    const state = fieldErrors(parsed.error)!;
    return { ...state, fieldErrors: { ...state.fieldErrors, ...errors } };
  }
  if (Object.keys(errors).length) return { error: "Please fix the highlighted contacts.", fieldErrors: errors };
  if (contacts.length === 0) return { error: "Add at least one point of contact." };
  if (contacts.length > 25) return { error: "Up to 25 points of contact." };
  const { name, overview, website, ...rest } = parsed.data;

  let logoUrl: string | undefined;
  try {
    logoUrl = await imageFromForm(fd, "logo");
  } catch (e) {
    if (e instanceof UploadError) return { fieldErrors: { logo: e.message } };
    throw e;
  }
  if (logoUrl) {
    await deleteImage(org.logoUrl);
  }

  const slug = name !== org.name ? await uniqueSlug(name, "civic", org.id) : org.slug;
  await db.$transaction([
    db.civicOrg.update({
      where: { id: org.id },
      data: {
        name,
        slug,
        overview: overview ?? "",
        website: normalizeUrl(website),
        ...nullify(rest),
        ...(logoUrl && { logoUrl }),
      },
    }),
    db.civicContact.deleteMany({ where: { orgId: org.id } }),
    db.civicContact.createMany({
      data: contacts.map((c, i) => ({ ...nullify(c), name: c.name, orgId: org.id, sortOrder: i })),
    }),
  ]);
  revalidateOrg(org.slug);
  if (slug !== org.slug) revalidateOrg(slug);
  return { success: "Organization profile saved." };
}

// ---- Events ----------------------------------------------------------------

const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(150),
    description: z.string().min(1, "Description is required").max(5000),
    location: optionalText(200),
    url: optionalUrl,
    startsAt: z.coerce.date({ errorMap: () => ({ message: "Start date & time is required" }) }),
    endsAt: z.coerce.date().optional(),
  })
  .refine((v) => !v.endsAt || v.endsAt > v.startsAt, { path: ["endsAt"], message: "End must be after start" });

export async function saveEvent(_: FormState, fd: FormData): Promise<FormState> {
  const { org } = await myOrg();
  const parsed = eventSchema.safeParse({
    title: str(fd, "title"),
    description: str(fd, "description"),
    location: str(fd, "location"),
    url: str(fd, "url"),
    startsAt: str(fd, "startsAt"),
    endsAt: str(fd, "endsAt"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const { url, startsAt, ...rest } = parsed.data;
  const data = { ...nullify(rest), title: rest.title, description: rest.description, startsAt, url: normalizeUrl(url) };

  const id = str(fd, "id");
  if (id) {
    const { count } = await db.event.updateMany({ where: { id, orgId: org.id }, data });
    if (count === 0) return { error: "Event not found." };
  } else {
    await db.event.create({ data: { ...data, orgId: org.id } });
  }
  revalidateOrg(org.slug);
  redirect("/account/civic/events?saved=1");
}

export async function deleteEvent(fd: FormData) {
  const { org } = await myOrg();
  const id = str(fd, "id");
  if (!id) return;
  await db.event.deleteMany({ where: { id, orgId: org.id } });
  revalidateOrg(org.slug);
}

// ---- Resources -------------------------------------------------------------

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: optionalText(2000),
  url: optionalUrl,
  category: optionalText(60),
});

export async function saveResource(_: FormState, fd: FormData): Promise<FormState> {
  const { org } = await myOrg();
  const parsed = resourceSchema.safeParse({
    title: str(fd, "title"),
    description: str(fd, "description"),
    url: str(fd, "url"),
    category: str(fd, "category"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const { url, ...rest } = parsed.data;
  const data = { ...nullify(rest), title: rest.title, url: normalizeUrl(url) };

  const id = str(fd, "id");
  if (id) {
    const { count } = await db.resource.updateMany({ where: { id, orgId: org.id }, data });
    if (count === 0) return { error: "Resource not found." };
  } else {
    await db.resource.create({ data: { ...data, orgId: org.id } });
  }
  revalidateOrg(org.slug);
  redirect("/account/civic/resources?saved=1");
}

export async function deleteResource(fd: FormData) {
  const { org } = await myOrg();
  const id = str(fd, "id");
  if (!id) return;
  await db.resource.deleteMany({ where: { id, orgId: org.id } });
  revalidateOrg(org.slug);
}
