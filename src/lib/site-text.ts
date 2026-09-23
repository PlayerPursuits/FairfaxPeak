import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";
import { getCurrentUser } from "./session";

export const EDIT_COOKIE = "fp_edit_text";

/** Every admin override, loaded once per request. */
export const getSiteTexts = cache(async (): Promise<Map<string, string>> => {
  const rows = await db.siteText.findMany({ select: { key: true, value: true } });
  return new Map(rows.map((r) => [r.key, r.value]));
});

/** True when an admin has switched on edit mode. */
export const isEditingText = cache(async (): Promise<boolean> => {
  if ((await cookies()).get(EDIT_COOKIE)?.value !== "1") return false;
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
});

/** The admin's text for `key`, or the built-in default. */
export async function siteText(key: string, fallback: string): Promise<string> {
  return (await getSiteTexts()).get(key) ?? fallback;
}
