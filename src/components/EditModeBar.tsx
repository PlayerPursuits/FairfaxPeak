import { toggleEditMode } from "@/app/actions/site-text";
import { isEditingText } from "@/lib/site-text";

/** Reminder shown to admins while edit mode is on. */
export async function EditModeBar() {
  if (!(await isEditingText())) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-brand-900 px-4 py-3 text-sm text-white shadow-lg">
      <span>
        <strong>Editing site text.</strong> Click any text with a dashed outline to change it. Changes go live when you save.
      </span>
      <form action={toggleEditMode}>
        <button className="btn-accent btn-sm">Done editing</button>
      </form>
    </div>
  );
}
