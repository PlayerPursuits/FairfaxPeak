import Link from "next/link";
import { requireRole } from "@/lib/session";
import { OfferForm } from "../OfferForm";
import { Section } from "../../../Section";

export default async function NewOffer() {
  await requireRole("BUSINESS", "/account/business/offers/new");
  return (
    <div className="space-y-4">
      <Link href="/account/business/offers" className="text-sm">
        ← Back to offers
      </Link>
      <Section title="New offer">
        <OfferForm />
      </Section>
    </div>
  );
}
