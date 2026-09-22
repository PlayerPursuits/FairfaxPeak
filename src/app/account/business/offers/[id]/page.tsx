import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { OfferForm } from "../OfferForm";
import { Section } from "../../../Section";

export default async function EditOffer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("BUSINESS", `/account/business/offers/${id}`);
  const offer = await db.offer.findFirst({ where: { id, business: { ownerId: user.id } } });
  if (!offer) notFound();
  return (
    <div className="space-y-4">
      <Link href="/account/business/offers" className="text-sm">
        ← Back to offers
      </Link>
      <Section title="Edit offer">
        <OfferForm offer={offer} />
      </Section>
    </div>
  );
}
