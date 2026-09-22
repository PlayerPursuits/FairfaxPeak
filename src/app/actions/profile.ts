"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addressFrom, addressShape, fieldErrors, nullify, optionalText, str, type FormState } from "@/lib/forms";
import { deleteImage, isFile, saveImage, UploadError } from "@/lib/uploads";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email").max(200),
  phone: optionalText(40),
  bio: optionalText(1000),
  ...addressShape,
});

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email")?.toLowerCase(),
    phone: str(fd, "phone"),
    bio: str(fd, "bio"),
    ...addressFrom(fd),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const { name, email, ...rest } = parsed.data;

  if (email !== user.email) {
    const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return { fieldErrors: { email: "That email is already in use." } };
  }

  let avatarUrl: string | undefined;
  const avatar = fd.get("avatar");
  if (isFile(avatar)) {
    try {
      avatarUrl = await saveImage(avatar);
    } catch (e) {
      if (e instanceof UploadError) return { fieldErrors: { avatar: e.message } };
      throw e;
    }
    const prev = await db.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } });
    await deleteImage(prev?.avatarUrl);
  }

  await db.user.update({
    where: { id: user.id },
    data: { name, email, ...nullify(rest), ...(avatarUrl && { avatarUrl }) },
  });
  revalidatePath("/account");
  return { success: "Profile saved." };
}

export async function updateNewsletter(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const freq = z.enum(["NONE", "DAILY", "WEEKLY"]).safeParse(str(fd, "newsletter"));
  if (!freq.success) return { error: "Choose a newsletter option." };
  await db.user.update({ where: { id: user.id }, data: { newsletter: freq.data } });
  revalidatePath("/account");
  return {
    success: freq.data === "NONE" ? "You're unsubscribed from the newsletter." : `You'll get the ${freq.data.toLowerCase()} newsletter.`,
  };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = fd.get("current");
  const next = fd.get("password");
  if (typeof current !== "string" || typeof next !== "string") return { error: "Fill in both fields." };
  if (next.length < 8) return { fieldErrors: { password: "Use at least 8 characters" } };
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(current, record.passwordHash))) return { fieldErrors: { current: "Current password is incorrect" } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { success: "Password updated." };
}
