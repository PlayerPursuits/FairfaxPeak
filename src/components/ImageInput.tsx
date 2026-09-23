"use client";

import { useRef, useState } from "react";
import { useFieldError } from "./form";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // what we'll accept from the camera roll
const MAX_EDGE = 2000; // longest side after shrinking, in pixels
const TARGET_BYTES = 900 * 1024; // photos bigger than this get re-encoded
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // stay under Vercel's 4.5 MB request limit

/** Downscale and re-encode large photos in the browser. Small files and GIFs pass through untouched. */
async function shrink(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= TARGET_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // PNGs may have transparency (logos), so keep them as WebP rather than JPEG.
  const type = file.type === "image/png" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], name, { type });
}

/**
 * Image picker. Chosen photos are shrunk in the browser, then submitted with
 * the form as `<name>` and saved by the server (Vercel Blob in production).
 */
export function ImageInput({ name, label, multiple, className }: { name: string; label: string; multiple?: boolean; className?: string }) {
  const serverError = useFieldError(name);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const id = `f-${name}`;

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    setError(null);
    setStatus(null);
    if (files.length === 0) return;

    const bad = files.find((f) => !TYPES.includes(f.type) || f.size > MAX_SOURCE_BYTES);
    if (bad) {
      setError("Images must be JPG, PNG, WebP, or GIF.");
      input.value = "";
      return;
    }

    setStatus("Preparing…");
    const ready = await Promise.all(files.map(shrink));
    const total = ready.reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setStatus(null);
      setError(multiple ? "Those photos are too large together. Try adding fewer at a time." : "That image is too large. Try a smaller one.");
      input.value = "";
      return;
    }
    const dt = new DataTransfer();
    ready.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    setStatus(`${ready.length} image${ready.length > 1 ? "s" : ""} ready — save to upload.`);
  }

  const err = error ?? serverError;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type="file"
        accept={TYPES.join(",")}
        multiple={multiple}
        onChange={onChange}
        className="input"
        aria-invalid={err ? true : undefined}
      />
      {status && !err && <p className="mt-1 text-xs text-brand-700">{status}</p>}
      {err && <p className="mt-1 text-xs font-medium text-red-700">{err}</p>}
    </div>
  );
}
