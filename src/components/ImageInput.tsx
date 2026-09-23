"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useFieldError } from "./form";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Image picker. With Blob storage (production) files upload directly from the
 * browser and the form submits their URLs as `<name>Url`; otherwise the file
 * itself is submitted as `<name>` and saved by the server.
 */
export function ImageInput({
  name,
  label,
  multiple,
  direct,
  className,
}: {
  name: string;
  label: string;
  multiple?: boolean;
  direct: boolean;
  className?: string;
}) {
  const serverError = useFieldError(name);
  const [urls, setUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = `f-${name}`;
  const ref = useRef<HTMLInputElement>(null);

  // Clear uploaded URLs when the surrounding form is reset (e.g. after a successful save).
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () => {
      setUrls([]);
      setStatus(null);
      setError(null);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!direct) return;
    const files = Array.from(e.target.files ?? []);
    setUrls([]);
    setError(null);
    if (files.length === 0) return;
    const bad = files.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      setError("Images must be JPG, PNG, WebP, or GIF and 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    try {
      const done: string[] = [];
      for (const [i, f] of files.entries()) {
        setStatus(files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : "Uploading…");
        const blob = await upload(`uploads/${f.name}`, f, { access: "public", handleUploadUrl: "/api/upload" });
        done.push(blob.url);
      }
      setUrls(done);
      setStatus(`${done.length} image${done.length > 1 ? "s" : ""} ready — save to apply.`);
    } catch (err) {
      setStatus(null);
      const message = (err as Error).message || "";
      setError(
        /private/i.test(message)
          ? "Photo storage is set to Private. It needs a Public Blob store so photos can be shown on the site."
          : message || "Upload failed. Please try again.",
      );
      e.target.value = "";
    }
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
        // In direct mode the file itself is not submitted, only the uploaded URLs.
        name={direct ? undefined : name}
        type="file"
        accept={TYPES.join(",")}
        multiple={multiple}
        onChange={onChange}
        className="input"
        aria-invalid={err ? true : undefined}
      />
      {urls.map((u) => (
        <input key={u} type="hidden" name={`${name}Url`} value={u} />
      ))}
      {status && !err && <p className="mt-1 text-xs text-brand-700">{status}</p>}
      {err && <p className="mt-1 text-xs font-medium text-red-700">{err}</p>}
    </div>
  );
}
