"use client";

import { useState } from "react";
import { submitReview } from "@/app/actions/reviews";
import { ActionForm, Field, SubmitButton, useFieldError } from "./form";

function StarPicker({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  const [hover, setHover] = useState(0);
  const error = useFieldError("rating");
  return (
    <fieldset>
      <legend className="label">
        Your rating<span className="text-clay-500"> *</span>
      </legend>
      <input type="hidden" name="rating" value={value || ""} />
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={value === n}
            onMouseEnter={() => setHover(n)}
            onClick={() => setValue(n)}
            className={`text-3xl leading-none transition ${(hover || value) >= n ? "text-sun-500" : "text-stone-300"} hover:scale-110`}
          >
            ★
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </fieldset>
  );
}

export function ReviewForm({
  businessId,
  existing,
}: {
  businessId: string;
  existing?: { rating: number; title: string | null; body: string } | null;
}) {
  return (
    <ActionForm action={submitReview} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <StarPicker initial={existing?.rating ?? 0} />
      <Field name="title" label="Headline" defaultValue={existing?.title ?? ""} placeholder="Sum it up in a few words" maxLength={120} />
      <Field as="textarea" name="body" label="Your review" required defaultValue={existing?.body ?? ""} placeholder="What stood out about your visit?" />
      <SubmitButton pendingText="Posting…">{existing ? "Update review" : "Post review"}</SubmitButton>
    </ActionForm>
  );
}
