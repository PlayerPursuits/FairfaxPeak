"use client";

import { useState } from "react";
import { register } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { ACCOUNT_TYPES, type Role } from "@/lib/constants";

type Category = { id: string; name: string; icon: string };

export function RegisterForm({
  initialType,
  categories,
  next,
  labels,
}: {
  initialType: Role;
  categories: Category[];
  next?: string;
  /** Admin-editable account type title and blurb, rendered on the server. */
  labels: Record<string, { title: React.ReactNode; blurb: React.ReactNode }>;
}) {
  const [role, setRole] = useState(initialType);

  return (
    <>
      <fieldset>
        <legend className="label">Account type</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACCOUNT_TYPES.map((t) => (
            <label
              key={t.role}
              className={`cursor-pointer rounded-xl border-2 p-4 transition ${role === t.role ? "border-brand-600 bg-brand-50" : "border-stone-200 hover:border-brand-300"}`}
            >
              <input type="radio" name="roleChoice" value={t.role} checked={role === t.role} onChange={() => setRole(t.role)} className="sr-only" />
              <span className="block font-semibold">{labels[t.role]?.title ?? t.title}</span>
              <span className="block text-xs font-semibold text-brand-700">{t.price}</span>
              <span className="mt-1 block text-xs text-stone-600">{labels[t.role]?.blurb ?? t.blurb}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ActionForm action={register} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="next" value={next ?? ""} />

        {role === "BUSINESS" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="orgName" label="Business name" required />
            <Field as="select" name="categoryId" label="Business category" defaultValue="">
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </Field>
          </div>
        )}
        {role === "CIVIC" && <Field name="orgName" label="Organization name" required />}

        <Field name="name" label={role === "PERSONAL" ? "Your name" : "Your name (primary contact)"} autoComplete="name" required />
        <Field name="email" label="Email" type="email" autoComplete="email" required />
        <Field name="password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" required />

        <Field as="select" name="newsletter" label="Fairfax Peak newsletter" defaultValue={role === "PERSONAL" ? "WEEKLY" : "NONE"}>
          <option value="WEEKLY">Weekly digest</option>
          <option value="DAILY">Daily digest</option>
          <option value="NONE">No thanks</option>
        </Field>

        {role === "BUSINESS" && (
          <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-brand-900">
            Next you’ll choose a membership plan — <strong>$20/month</strong> or <strong>$200/year</strong>. Your listing goes live once your membership is active.
          </p>
        )}

        <SubmitButton pendingText="Creating account…" className="btn-primary w-full">
          {role === "BUSINESS" ? "Continue to membership" : "Create account"}
        </SubmitButton>
      </ActionForm>
    </>
  );
}
