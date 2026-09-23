"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { loadDemoData, removeDemoData } from "@/lib/demo";
import type { FormState } from "@/lib/forms";

export async function loadDemo(_: FormState, fd: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/account/admin");
  const password = fd.get("password");
  if (typeof password !== "string" || password.length < 8) {
    return { fieldErrors: { password: "Use at least 8 characters" } };
  }
  try {
    await loadDemoData(db, password);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  redirect("/account/admin?done=loaded");
}

export async function removeDemo(_: FormState, _fd: FormData): Promise<FormState> {
  await requireRole("ADMIN", "/account/admin");
  const count = await removeDemoData(db);
  revalidatePath("/", "layout");
  redirect(`/account/admin?done=removed&count=${count}`);
}
