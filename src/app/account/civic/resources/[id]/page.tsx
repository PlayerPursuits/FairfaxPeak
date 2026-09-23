import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ResourceForm } from "../ResourceForm";
import { Section } from "../../../Section";

export default async function EditResource({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("CIVIC", `/account/civic/resources/${id}`);
  const resource = await db.resource.findFirst({ where: { id, org: { ownerId: user.id } } });
  if (!resource) notFound();
  return (
    <div className="space-y-4">
      <Link href="/account/civic/resources" className="text-sm">
        ← Back to resources
      </Link>
      <Section title="Edit resource">
        <ResourceForm resource={resource} />
      </Section>
    </div>
  );
}
