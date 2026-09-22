import { z } from "zod";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | undefined;

/** Read a trimmed string field; empty strings become undefined. */
export function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

export function fieldErrors(err: z.ZodError): FormState {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path.join(".");
    if (!out[k]) out[k] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors: out };
}

export const optionalText = (max = 500) => z.string().max(max).optional();
export const optionalEmail = z.string().email("Enter a valid email").optional();
export const optionalUrl = z
  .string()
  .max(300)
  .regex(/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i, "Enter a valid web address")
  .optional();

export const addressShape = {
  street: optionalText(200),
  city: optionalText(100),
  state: optionalText(50),
  zip: optionalText(20),
};

export function addressFrom(fd: FormData) {
  return { street: str(fd, "street"), city: str(fd, "city"), state: str(fd, "state"), zip: str(fd, "zip") };
}

/** Prisma wants null (not undefined) to clear a column. */
export function nullify<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]-?: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K] } {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])) as never;
}
