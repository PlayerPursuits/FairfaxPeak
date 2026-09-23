"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCommunity } from "@/lib/community";
import { requireRole } from "@/lib/session";
import { EDIT_COOKIE } from "@/lib/site-text";
import type { EditTarget } from "@/components/editable-target";

const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), key: z.string().regex(/^[a-z0-9_.-]{1,100}$/i) }),
  z.object({ kind: z.literal("community"), field: z.enum(["tagline", "description"]) }),
  z.object({ kind: z.literal("highlight"), id: z.string().min(1), field: z.enum(["title", "body"]) }),
]);

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Save an inline edit. For site text, `value === null` (or the default text)
 * removes the override so the built-in wording comes back.
 */
export async function saveEditable(target: EditTarget, value: string | null, fallback?: string): Promise<SaveResult> {
  const user = await requireRole("ADMIN");
  const parsed = targetSchema.safeParse(target);
  if (!parsed.success) return { ok: false, error: "This text can't be edited." };
  const t = parsed.data;
  const text = value?.trim() ?? null;
  if (text !== null && text.length > 5000) return { ok: false, error: "Keep it under 5,000 characters." };

  if (t.kind === "text") {
    if (text === null || text === "" || text === fallback?.trim()) {
      await db.siteText.deleteMany({ where: { key: t.key } });
    } else {
      await db.siteText.upsert({
        where: { key: t.key },
        create: { key: t.key, value: text, updatedBy: user.email },
        update: { value: text, updatedBy: user.email },
      });
    }
  } else {
    if (!text) return { ok: false, error: "This can't be empty." };
    if (t.kind === "community") {
      const community = await getCommunity();
      await db.community.update({ where: { id: community.id }, data: { [t.field]: text } });
    } else {
      const { count } = await db.areaHighlight.updateMany({ where: { id: t.id }, data: { [t.field]: text } });
      if (count === 0) return { ok: false, error: "That card no longer exists." };
    }
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleEditMode() {
  await requireRole("ADMIN");
  const jar = await cookies();
  if (jar.get(EDIT_COOKIE)?.value === "1") jar.delete(EDIT_COOKIE);
  else jar.set(EDIT_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
