import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";

// Images go to Vercel Blob in production and to public/uploads on local disk
// in development. The browser shrinks photos before submitting (see
// <ImageInput>), which keeps form posts under Vercel's 4.5 MB request limit.
//
// Vercel connects a Blob store in one of two ways, depending on when it was
// created:
//   - a read-write token: <PREFIX>_READ_WRITE_TOKEN = vercel_blob_rw_…
//   - a store ID plus Vercel's built-in OIDC sign-in: <PREFIX>_STORE_ID = store_…
// Both are supported, whatever prefix was chosen when connecting.

function findEnv(suffix: string, valuePrefix: string): string | undefined {
  return Object.entries(process.env).find(([k, v]) => k.endsWith(suffix) && v?.startsWith(valuePrefix))?.[1];
}

const blobToken = process.env.BLOB_READ_WRITE_TOKEN || findEnv("READ_WRITE_TOKEN", "vercel_blob_rw_");
const blobStoreId = process.env.BLOB_STORE_ID || findEnv("STORE_ID", "store_");

export const blobEnabled = Boolean(blobToken || blobStoreId);

/** Credentials for @vercel/blob calls: the token if there is one, otherwise the store ID (OIDC). */
const blobAuth = blobToken ? { token: blobToken } : { storeId: blobStoreId };

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

function isBlobUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function saveImage(file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new UploadError("Images must be JPG, PNG, WebP, or GIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  const name = `${randomUUID()}${ext}`;
  if (blobEnabled) {
    const blob = await put(`uploads/${name}`, file, { access: "public", contentType: file.type, ...blobAuth });
    return blob.url;
  }
  // Vercel's filesystem is read-only, so local-disk storage can't work there.
  if (process.env.VERCEL) throw new UploadError(NOT_CONNECTED);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Turn unexpected storage failures into a message the form can show, and log the details. */
async function friendly<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UploadError) throw e;
    console.error("upload failed", e);
    const message = e instanceof Error ? e.message : "";
    if (/private/i.test(message)) {
      throw new UploadError("Photo storage is set to Private. It needs a Public Blob store so photos can be shown on the site.");
    }
    throw new UploadError("The image couldn't be saved. Please try again, or try a different image.");
  }
}

/** The stored URL for an image field, or undefined if no file was chosen. */
export async function imageFromForm(fd: FormData, name: string): Promise<string | undefined> {
  const file = fd.get(name);
  return isFile(file) ? friendly(() => saveImage(file)) : undefined;
}

/** Stored URLs for every file in a multi-image field. */
export async function imagesFromForm(fd: FormData, name: string): Promise<string[]> {
  const files = fd.getAll(name).filter(isFile);
  return friendly(async () => {
    const out: string[] = [];
    for (const f of files) out.push(await saveImage(f));
    return out;
  });
}

export function countImages(fd: FormData, name: string): number {
  return fd.getAll(name).filter(isFile).length;
}

export async function deleteImage(url: string | null | undefined) {
  if (!url) return;
  if (isBlobUrl(url)) {
    if (blobEnabled) await del(url, blobAuth).catch((e) => console.error("could not delete image", e));
    return;
  }
  if (!url.startsWith("/uploads/")) return;
  await unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
}
