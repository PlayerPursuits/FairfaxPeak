import "server-only";
import { db } from "./db";
import { slugify } from "./utils";

export async function uniqueSlug(name: string, kind: "business" | "civic", excludeId?: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing =
      kind === "business"
        ? await db.business.findUnique({ where: { slug: candidate }, select: { id: true } })
        : await db.civicOrg.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${base}-${Date.now()}`;
}
