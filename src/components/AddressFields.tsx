import { Field } from "./form";

type Address = { street?: string | null; city?: string | null; state?: string | null; zip?: string | null };

export function AddressFields({ value, defaults }: { value?: Address; defaults?: Address }) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field name="street" label="Street address" defaultValue={value?.street ?? ""} className="sm:col-span-6" autoComplete="street-address" />
      <Field name="city" label="City" defaultValue={value?.city ?? defaults?.city ?? ""} className="sm:col-span-3" autoComplete="address-level2" />
      <Field name="state" label="State" defaultValue={value?.state ?? defaults?.state ?? ""} className="sm:col-span-1" autoComplete="address-level1" />
      <Field name="zip" label="ZIP" defaultValue={value?.zip ?? ""} className="sm:col-span-2" autoComplete="postal-code" />
    </div>
  );
}
