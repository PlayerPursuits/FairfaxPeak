import Link from "next/link";
import { requireRole } from "@/lib/session";
import { ResourceForm } from "../ResourceForm";
import { Section } from "../../../Section";

export default async function NewResource() {
  await requireRole("CIVIC", "/account/civic/resources/new");
  return (
    <div className="space-y-4">
      <Link href="/account/civic/resources" className="text-sm">
        ← Back to resources
      </Link>
      <Section title="New resource">
        <ResourceForm />
      </Section>
    </div>
  );
}
