"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { uniqueSlug } from "@/lib/slugs";
import { normalizeUrl, appUrl } from "@/lib/utils";
import { billingEnabled, lineItemFor, stripe } from "@/lib/stripe";
import { PLANS, type Plan } from "@/lib/constants";
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
import { countImages, deleteImage, imageFromForm, imagesFromForm, UploadError } from "@/lib/uploads";

async function myBusiness() {
  const user = await requireRole("BUSINESS", "/account/business");
  const business = await db.business.findUnique({ where: { ownerId: user.id } });
  if (!business) redirect("/account");
  return { user, business };
}

function revalidateBusiness(slug: string) {
  revalidatePath(`/business/${slug}`);
  revalidatePath("/account/business");
  revalidatePath("/directory");
  revalidatePath("/offers");
  revalidatePath("/");
}

const profileSchema = z.object({
  name: z.string().min(1, "Business name is required").max(120),
  categoryId: z.string().optional(),
  tagline: optionalText(160),
  description: z.string().max(5000).optional(),
  phone: optionalText(40),
  email: optionalEmail,
  website: optionalUrl,
  hours: optionalText(1000),
  ...addressShape,
});

export async function updateBusinessProfile(_: FormState, fd: FormData): Promise<FormState> {
  const { business } = await myBusiness();
  const parsed = profileSchema.safeParse({
    name: str(fd, "name"),
    categoryId: str(fd, "categoryId"),
    tagline: str(fd, "tagline"),
    description: str(fd, "description"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    website: str(fd, "website"),
    hours: str(fd, "hours"),
    ...addressFrom(fd),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const { name, description, website, ...rest } = parsed.data;

  let logoUrl: string | undefined;
  try {
    logoUrl = await imageFromForm(fd, "logo");
  } catch (e) {
    if (e instanceof UploadError) return { fieldErrors: { logo: e.message } };
    throw e;
  }
  if (logoUrl) {
    await deleteImage(business.logoUrl);
  }

  let coverUrl: string | undefined;
  try {
    coverUrl = await imageFromForm(fd, "cover");
  } catch (e) {
    if (e instanceof UploadError) return { fieldErrors: { cover: e.message } };
    throw e;
  }
  const removeCover = !coverUrl && fd.get("removeCover") === "on";
  if (coverUrl || removeCover) await deleteImage(business.coverUrl);

  const slug = name !== business.name ? await uniqueSlug(name, "business", business.id) : business.slug;
  await db.business.update({
    where: { id: business.id },
    data: {
      name,
      slug,
      description: description ?? "",
      website: normalizeUrl(website),
      ...nullify(rest),
      ...(logoUrl && { logoUrl }),
      ...(coverUrl ? { coverUrl } : removeCover ? { coverUrl: null } : {}),
    },
  });
  revalidateBusiness(business.slug);
  if (slug !== business.slug) revalidateBusiness(slug);
  return { success: "Business profile saved." };
}

// ---- Gallery ---------------------------------------------------------------

const MAX_GALLERY = 24;

export async function uploadGalleryImages(_: FormState, fd: FormData): Promise<FormState> {
  const { business } = await myBusiness();
  const incoming = countImages(fd, "images");
  if (incoming === 0) return { error: "Choose at least one image." };

  const count = await db.businessImage.count({ where: { businessId: business.id } });
  if (count + incoming > MAX_GALLERY) return { error: `Galleries are limited to ${MAX_GALLERY} images.` };

  let urls: string[];
  try {
    urls = await imagesFromForm(fd, "images");
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  await db.businessImage.createMany({
    data: urls.map((url, i) => ({ businessId: business.id, url, sortOrder: count + i })),
  });
  revalidateBusiness(business.slug);
  return { success: `${urls.length} image${urls.length > 1 ? "s" : ""} added.` };
}

export async function updateGalleryImage(fd: FormData) {
  const { business } = await myBusiness();
  const id = str(fd, "id");
  if (!id) return;
  await db.businessImage.updateMany({
    where: { id, businessId: business.id },
    data: { caption: str(fd, "caption") ?? null },
  });
  revalidateBusiness(business.slug);
}

export async function deleteGalleryImage(fd: FormData) {
  const { business } = await myBusiness();
  const id = str(fd, "id");
  if (!id) return;
  const image = await db.businessImage.findFirst({ where: { id, businessId: business.id } });
  if (!image) return;
  await db.businessImage.delete({ where: { id } });
  await deleteImage(image.url);
  revalidateBusiness(business.slug);
}

// ---- Offers ----------------------------------------------------------------

const offerSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(120),
    description: z.string().min(1, "Description is required").max(2000),
    discount: optionalText(60),
    code: optionalText(40),
    terms: optionalText(1000),
    exclusive: z.boolean(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt, {
    path: ["endsAt"],
    message: "End date must be after the start date",
  });

function parseOffer(fd: FormData) {
  return offerSchema.safeParse({
    title: str(fd, "title"),
    description: str(fd, "description"),
    discount: str(fd, "discount"),
    code: str(fd, "code"),
    terms: str(fd, "terms"),
    exclusive: fd.get("exclusive") === "on",
    startsAt: dateOnly(str(fd, "startsAt"), "00:00:00"),
    endsAt: dateOnly(str(fd, "endsAt"), "23:59:59"),
  });
}

/** Date inputs send YYYY-MM-DD; anchor to local start/end of day so an offer runs through its expiry date. */
function dateOnly(v: string | undefined, time: string) {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T${time}` : v;
}

export async function saveOffer(_: FormState, fd: FormData): Promise<FormState> {
  const { business } = await myBusiness();
  const parsed = parseOffer(fd);
  if (!parsed.success) return fieldErrors(parsed.error);
  const { startsAt, endsAt, ...rest } = parsed.data;
  const data = { ...nullify(rest), exclusive: rest.exclusive, startsAt: startsAt ?? new Date(), endsAt: endsAt ?? null };

  const id = str(fd, "id");
  if (id) {
    const { count } = await db.offer.updateMany({ where: { id, businessId: business.id }, data });
    if (count === 0) return { error: "Offer not found." };
  } else {
    await db.offer.create({ data: { ...data, businessId: business.id } });
  }
  revalidateBusiness(business.slug);
  redirect("/account/business/offers?saved=1");
}

export async function deleteOffer(fd: FormData) {
  const { business } = await myBusiness();
  const id = str(fd, "id");
  if (!id) return;
  await db.offer.deleteMany({ where: { id, businessId: business.id } });
  revalidateBusiness(business.slug);
}

export async function endOffer(fd: FormData) {
  const { business } = await myBusiness();
  const id = str(fd, "id");
  if (!id) return;
  await db.offer.updateMany({ where: { id, businessId: business.id }, data: { endsAt: new Date() } });
  revalidateBusiness(business.slug);
}

// ---- Billing ---------------------------------------------------------------

export async function startCheckout(fd: FormData) {
  const { user, business } = await myBusiness();
  const plan = str(fd, "plan") as Plan | undefined;
  if (!plan || !(plan in PLANS)) return;

  if (!billingEnabled) {
    // Demo mode: no Stripe keys configured. Activate the listing so the rest of
    // the site can be exercised end to end.
    const periodEnd = new Date();
    if (plan === "MONTHLY") periodEnd.setMonth(periodEnd.getMonth() + 1);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    await db.business.update({
      where: { id: business.id },
      data: { subscriptionStatus: "ACTIVE", plan, currentPeriodEnd: periodEnd },
    });
    revalidateBusiness(business.slug);
    redirect("/account/billing?success=1&demo=1");
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [lineItemFor(plan)],
    ...(business.stripeCustomerId ? { customer: business.stripeCustomerId } : { customer_email: user.email }),
    client_reference_id: business.id,
    metadata: { businessId: business.id },
    subscription_data: { metadata: { businessId: business.id } },
    success_url: appUrl("/account/billing?success=1&session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: appUrl("/account/billing?canceled=1"),
  });
  redirect(session.url!);
}

export async function openBillingPortal() {
  const { business } = await myBusiness();
  if (!billingEnabled || !business.stripeCustomerId) redirect("/account/billing");
  const portal = await stripe().billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: appUrl("/account/billing"),
  });
  redirect(portal.url);
}

/** Demo mode only: lets testers cancel without Stripe. */
export async function cancelDemoSubscription() {
  const { business } = await myBusiness();
  if (billingEnabled) redirect("/account/billing");
  await db.business.update({ where: { id: business.id }, data: { subscriptionStatus: "CANCELED" } });
  revalidateBusiness(business.slug);
  redirect("/account/billing");
}
