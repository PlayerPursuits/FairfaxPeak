import { saveResource } from "@/app/actions/civic";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { RESOURCE_CATEGORIES } from "@/lib/constants";

type Resource = { id: string; title: string; description: string | null; url: string | null; category: string | null };

export function ResourceForm({ resource }: { resource?: Resource }) {
  return (
    <ActionForm action={saveResource} className="space-y-4">
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Title" defaultValue={resource?.title} required />
        <Field as="select" name="category" label="Category" defaultValue={resource?.category ?? "Other"}>
          {RESOURCE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Field>
      </div>
      <Field as="textarea" name="description" label="Description" rows={3} defaultValue={resource?.description ?? ""} />
      <Field name="url" label="Link" defaultValue={resource?.url ?? ""} placeholder="https://" />
      <SubmitButton>{resource ? "Save resource" : "Add resource"}</SubmitButton>
    </ActionForm>
  );
}
