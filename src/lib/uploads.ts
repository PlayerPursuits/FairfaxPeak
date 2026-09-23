import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";

// Images go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production),
// otherwise to public/uploads on local disk (development).
//
// In production the browser uploads straight to Blob (see /api/upload and
// <ImageInput>), because Vercel caps request bodies at 4.5 MB. Forms then
// submit the resulting URLs, which `acceptImageUrl` checks before saving.

/**
 * The Blob store token. Vercel names it <PREFIX>_READ_WRITE_TOKEN after the
 * prefix chosen when the store was connected, so accept any prefix.
 */
export const blobToken =
  process.env.BLOB_READ_WRITE_TOKEN ||
  Object.entries(process.env).find(([k, v]) => k.endsWith("READ_WRITE_TOKEN") && v?.startsWith("vercel_blob_rw_"))?.[1];

export const blobEnabled = Boolean(blobToken);

const NOT_CONNECTED =
  "Photo uploads aren't set up yet: connect a Public Blob store to this project in Vercel (Storage → Blob), then redeploy.";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export class UploadError extends Error {}

export function isFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v && v.size > 0;
}

// Tokens look like vercel_blob_rw_<storeId>_<secret>; public URLs are served from <storeid>.public.blob.vercel-storage.com.
const storeId = blobToken?.split("_")[3]?.toLowerCase();

function isBlobUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** True only for files in this project's own Blob store. */
function isOwnBlobUrl(url: string) {
  return isBlobUrl(url) && (!storeId || new URL(url).hostname === `${storeId}.public.blob.vercel-storage.com`);
}

/** Save an uploaded File (local development, or small server-side uploads). */
export async function saveImage(file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new UploadError("Images must be JPG, PNG, WebP, or GIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  const name = `${randomUUID()}${ext}`;
  if (blobEnabled) {
    const blob = await put(`uploads/${name}`, file, { access: "public", contentType: file.type, token: blobToken });
    return blob.url;
  }
  // Vercel's filesystem is read-only, so local-disk storage can't work there.
  if (process.env.VERCEL) throw new UploadError(NOT_CONNECTED);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** A URL the browser got back from a direct Blob upload. Only our Blob store is accepted. */
export function acceptImageUrl(url: string): string {
  if (!blobEnabled) throw new UploadError(NOT_CONNECTED);
  if (!isOwnBlobUrl(url)) throw new UploadError("Image upload failed. Please try again.");
  return url;
}

/**
 * Read one image field from a form: a direct-upload URL (`<name>Url`) or a
 * File (`<name>`). Returns the stored URL, or undefined if nothing was chosen.
 */
export async function imageFromForm(fd: FormData, name: string): Promise<string | undefined> {
  return friendly(async () => {
    const url = fd.get(`${name}Url`);
    if (typeof url === "string" && url) return acceptImageUrl(url);
    const file = fd.get(name);
    return isFile(file) ? saveImage(file) : undefined;
  });
}

/** Turn unexpected storage failures into a message the form can show, and log the details. */
async function friendly<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UploadError) throw e;
    console.error("upload failed", e);
    throw new UploadError("The image couldn't be saved. Please try again, or try a different image.");
  }
}

/** All images from a multi-image field, in the same two forms as `imageFromForm`. */
export async function imagesFromForm(fd: FormData, name: string): Promise<string[]> {
  return friendly(() => collectImages(fd, name));
}

async function collectImages(fd: FormData, name: string): Promise<string[]> {
  const urls = fd.getAll(`${name}Url`).filter((v): v is string => typeof v === "string" && v !== "");
  if (urls.length) return urls.map(acceptImageUrl);
  const files = fd.getAll(name).filter(isFile);
  const out: string[] = [];
  for (const f of files) out.push(await saveImage(f));
  return out;
}

export function countImages(fd: FormData, name: string): number {
  const urls = fd.getAll(`${name}Url`).filter((v) => typeof v === "string" && v !== "").length;
  return urls || fd.getAll(name).filter(isFile).length;
}

export async function deleteImage(url: string | null | undefined) {
  if (!url) return;
  if (isBlobUrl(url)) {
    if (blobEnabled) await del(url, { token: blobToken }).catch(() => {});
    return;
  }
  if (!url.startsWith("/uploads/")) return;
  await unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
}
