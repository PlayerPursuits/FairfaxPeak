"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { str } from "@/lib/forms";

/** Save an offer to the member's account (and reveal its code). */
export async function claimOffer(fd: FormData) {
  const offerId = str(fd, "offerId");
  const back = str(fd, "back") ?? "/offers";
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (!offerId) return;
  await db.offerClaim.upsert({
    where: { offerId_userId: { offerId, userId: user.id } },
    create: { offerId, userId: user.id },
    update: {},
  });
  revalidatePath(back);
  revalidatePath("/account");
}
