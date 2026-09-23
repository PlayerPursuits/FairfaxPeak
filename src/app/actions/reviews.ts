"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fieldErrors, str, type FormState } from "@/lib/forms";

const reviewSchema = z.object({
  businessId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10, "Tell us a bit more (at least 10 characters)").max(3000),
});

export async function submitReview(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse({
    businessId: str(fd, "businessId"),
    rating: str(fd, "rating") ?? 0,
    title: str(fd, "title"),
    body: str(fd, "body"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const { businessId, ...data } = parsed.data;

  const business = await db.business.findUnique({ where: { id: businessId }, select: { ownerId: true, slug: true } });
  if (!business) return { error: "Business not found." };
  if (business.ownerId === user.id) return { error: "You can't review your own business." };

  await db.review.upsert({
    where: { businessId_userId: { businessId, userId: user.id } },
    create: { businessId, userId: user.id, ...data },
    update: data,
  });
  revalidatePath(`/business/${business.slug}`);
  return { success: "Thanks! Your review is posted." };
}

export async function deleteReview(fd: FormData) {
  const user = await requireUser();
  const id = str(fd, "id");
  if (!id) return;
  const review = await db.review.findUnique({ where: { id }, include: { business: { select: { slug: true } } } });
  if (!review || (review.userId !== user.id && user.role !== "ADMIN")) return;
  await db.review.delete({ where: { id } });
  revalidatePath(`/business/${review.business.slug}`);
  revalidatePath("/account");
}
