import { saveEvent } from "@/app/actions/civic";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { toDateTimeLocal } from "@/lib/utils";

type Event = { id: string; title: string; description: string; location: string | null; url: string | null; startsAt: Date; endsAt: Date | null };

export function EventForm({ event }: { event?: Event }) {
  return (
    <ActionForm action={saveEvent} className="space-y-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      <Field name="title" label="Event title" defaultValue={event?.title} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="startsAt" label="Starts" type="datetime-local" defaultValue={toDateTimeLocal(event?.startsAt)} required />
        <Field name="endsAt" label="Ends" type="datetime-local" defaultValue={toDateTimeLocal(event?.endsAt)} />
      </div>
      <Field name="location" label="Location" defaultValue={event?.location ?? ""} placeholder="Town Hall, 100 Main St" />
      <Field as="textarea" name="description" label="Description" rows={5} defaultValue={event?.description} required />
      <Field name="url" label="More info link" defaultValue={event?.url ?? ""} placeholder="https://" />
      <SubmitButton>{event ? "Save event" : "Publish event"}</SubmitButton>
    </ActionForm>
  );
}
