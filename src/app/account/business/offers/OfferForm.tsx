import { saveOffer } from "@/app/actions/business";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { toDateInput } from "@/lib/utils";

type Offer = {
  id: string;
  title: string;
  description: string;
  discount: string | null;
  code: string | null;
  terms: string | null;
  exclusive: boolean;
  startsAt: Date;
  endsAt: Date | null;
};

export function OfferForm({ offer }: { offer?: Offer }) {
  return (
    <ActionForm action={saveOffer} className="space-y-4">
      {offer && <input type="hidden" name="id" value={offer.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="title" label="Offer title" defaultValue={offer?.title} required className="sm:col-span-2" placeholder="Free coffee with any pastry" />
        <Field name="discount" label="Headline discount" defaultValue={offer?.discount ?? ""} placeholder="20% OFF" maxLength={60} />
      </div>
      <Field as="textarea" name="description" label="Description" rows={3} defaultValue={offer?.description} required />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="code" label="Coupon code" defaultValue={offer?.code ?? ""} placeholder="PEAK20" hint="Optional" />
        <Field name="startsAt" label="Starts" type="date" defaultValue={toDateInput(offer?.startsAt)} hint="Defaults to today" />
        <Field name="endsAt" label="Expires" type="date" defaultValue={toDateInput(offer?.endsAt)} hint="Leave blank for no expiry" />
      </div>
      <Field as="textarea" name="terms" label="Terms & conditions" rows={2} defaultValue={offer?.terms ?? ""} placeholder="One per customer. Not valid with other offers." />
      <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-4">
        <input type="checkbox" name="exclusive" defaultChecked={offer?.exclusive} className="mt-1 h-4 w-4 accent-brand-700" />
        <span>
          <span className="block text-sm font-semibold">Members-only offer</span>
          <span className="block text-xs text-stone-600">Only registered Fairfax Peak residents can claim it and see the code.</span>
        </span>
      </label>
      <SubmitButton>{offer ? "Save offer" : "Publish offer"}</SubmitButton>
    </ActionForm>
  );
}
