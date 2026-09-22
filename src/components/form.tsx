"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/forms";

const FormStateContext = createContext<FormState>(undefined);
const PendingContext = createContext<boolean | null>(null);

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/**
 * Wraps a server action with useActionState and exposes the returned
 * field errors to nested <Field>s via context.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.success) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <FormStateContext.Provider value={state}>
      <PendingContext.Provider value={pending}>
        <form
          ref={ref}
          action={formAction}
          // Submit manually so React doesn't reset the fields after a validation error.
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => formAction(fd));
          }}
          className={className}
          noValidate
        >
          <FormMessage />
          {children}
        </form>
      </PendingContext.Provider>
    </FormStateContext.Provider>
  );
}

function FormMessage() {
  const state = useContext(FormStateContext);
  if (state?.error)
    return (
      <p role="alert" className="col-span-full mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {state.error}
      </p>
    );
  if (state?.success)
    return (
      <p role="status" className="col-span-full mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        {state.success}
      </p>
    );
  return null;
}

export function useFieldError(name: string) {
  return useContext(FormStateContext)?.fieldErrors?.[name];
}

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
} & (
  | ({ as?: "input" } & React.InputHTMLAttributes<HTMLInputElement>)
  | ({ as: "textarea" } & React.TextareaHTMLAttributes<HTMLTextAreaElement>)
  | ({ as: "select"; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>)
);

export function Field(props: FieldProps) {
  const { name, label, hint, required, className, ...rest } = props;
  const error = useFieldError(name);
  const id = `f-${name}`;
  const common = {
    id,
    name,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined,
    className: `input ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`,
  };
  let control: ReactNode;
  if (rest.as === "textarea") {
    const { as: _, ...r } = rest;
    control = <textarea rows={5} {...common} {...r} />;
  } else if (rest.as === "select") {
    const { as: _, children, ...r } = rest;
    control = (
      <select {...common} {...r}>
        {children}
      </select>
    );
  } else {
    const { as: _, ...r } = rest as { as?: "input" } & React.InputHTMLAttributes<HTMLInputElement>;
    control = <input {...common} {...r} />;
  }
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {control}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn-primary",
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const status = useFormStatus();
  const ctxPending = useContext(PendingContext);
  const pending = ctxPending ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Submit button for plain (non-ActionForm) forms that asks before destructive actions. */
export function ConfirmButton({ children, message, className = "btn-danger btn-sm" }: { children: ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
