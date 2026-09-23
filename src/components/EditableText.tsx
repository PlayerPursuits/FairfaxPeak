"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { saveEditable } from "@/app/actions/site-text";
import type { EditTarget } from "./editable-target";

/**
 * Admin edit mode: outlined text that opens an editor when clicked. Clicks
 * never reach surrounding links or buttons, so link text can be edited too.
 */
export function EditableText({
  target,
  value,
  fallback,
  multiline,
  block,
  children,
}: {
  target: EditTarget;
  value: string;
  fallback?: string;
  multiline?: boolean;
  /** Wrap block content (paragraphs) instead of inline text. */
  block?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    field.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function stop(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function save(next: string | null) {
    setError(null);
    start(async () => {
      const res = await saveEditable(target, next, fallback);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      router.refresh();
    });
  }

  const customized = fallback !== undefined && value !== fallback;
  const Wrapper = block ? "div" : "span";
  return (
    <>
      <Wrapper
        role="button"
        tabIndex={0}
        title="Click to edit"
        onClick={(e) => {
          stop(e);
          setDraft(value);
          setError(null);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            stop(e);
            setDraft(value);
            setOpen(true);
          }
        }}
        className="cursor-text rounded-sm outline-2 outline-offset-2 outline-fp-cyan outline-dashed hover:bg-fp-cyan/10"
      >
        {children ?? value}
      </Wrapper>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Edit text"
          >
            <div className="card w-full max-w-lg p-5 text-left text-stone-800" onClick={(e) => e.stopPropagation()}>
              <p className="mb-2 text-sm font-semibold">Edit text</p>
              <textarea
                ref={field}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={multiline ? 8 : 3}
                className="input font-sans text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !multiline && !e.shiftKey) {
                    e.preventDefault();
                    save(draft);
                  }
                }}
              />
              {multiline && <p className="mt-1 text-xs text-stone-500">Leave a blank line between paragraphs.</p>}
              {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {customized && (
                    <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => save(null)}>
                      Reset to original
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-outline btn-sm" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => save(draft)}>
                    {pending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
