import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Local-disk storage under public/uploads. For production deployments on
// ephemeral hosts, swap this module for S3 / R2 / Vercel Blob.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export class UploadError extends Error {}

export function isFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v && v.size > 0;
}

export async function saveImage(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Images must be JPG, PNG, WebP, or GIF.");
  if (file.size > MAX_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function deleteImage(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  const name = path.basename(url);
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
