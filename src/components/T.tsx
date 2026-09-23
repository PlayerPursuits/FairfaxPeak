import { EditableText } from "./EditableText";
import { getSiteTexts, isEditingText } from "@/lib/site-text";

/**
 * Admin-editable site text. Renders the admin's wording for `k` if they've
 * changed it, otherwise `children` (the default). In edit mode admins can
 * click it to change it.
 */
export async function T({ k, children, multiline }: { k: string; children: string; multiline?: boolean }) {
  const [texts, editing] = await Promise.all([getSiteTexts(), isEditingText()]);
  const value = texts.get(k) ?? children;
  if (!editing) return <>{value}</>;
  return <EditableText target={{ kind: "text", key: k }} value={value} fallback={children} multiline={multiline} />;
}
