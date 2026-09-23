"use client";

import { useState } from "react";
import { useFieldError } from "./form";

type Contact = { name: string; title: string | null; email: string | null; phone: string | null };

let nextKey = 0;

/** Repeater field: add/remove/reorder points of contact. Submits as contacts[i][field]. */
export function ContactsRepeater({ initial }: { initial: Contact[] }) {
  const [rows, setRows] = useState(() =>
    (initial.length ? initial : [{ name: "", title: "", email: "", phone: "" }]).map((c) => ({ key: nextKey++, ...c })),
  );

  const add = () => setRows((r) => [...r, { key: nextKey++, name: "", title: "", email: "", phone: "" }]);
  const remove = (key: number) => setRows((r) => r.filter((x) => x.key !== key));
  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const copy = [...r];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <ContactRow key={row.key} index={i} row={row} total={rows.length} onRemove={() => remove(row.key)} onMove={(d) => move(i, d)} />
      ))}
      <button type="button" onClick={add} className="btn-outline btn-sm">
        + Add point of contact
      </button>
    </div>
  );
}

function ContactRow({
  index,
  row,
  total,
  onRemove,
  onMove,
}: {
  index: number;
  row: Contact;
  total: number;
  onRemove: () => void;
  onMove: (d: -1 | 1) => void;
}) {
  const nameErr = useFieldError(`contacts.${index}.name`);
  const emailErr = useFieldError(`contacts.${index}.email`);
  const field = (f: keyof Contact, label: string, type = "text", auto?: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        name={`contacts[${index}][${f}]`}
        defaultValue={row[f] ?? ""}
        type={type}
        autoComplete={auto}
        className="input"
      />
    </label>
  );
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">Contact {index + 1}</span>
        <div className="flex gap-1">
          <button type="button" className="btn-outline btn-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
            ↑
          </button>
          <button type="button" className="btn-outline btn-sm" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down">
            ↓
          </button>
          <button type="button" className="btn-danger btn-sm" onClick={onRemove} disabled={total === 1}>
            Remove
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          {field("name", "Name *", "text", "off")}
          {nameErr && <p className="mt-1 text-xs font-medium text-red-700">{nameErr}</p>}
        </div>
        {field("title", "Title / role")}
        <div>
          {field("email", "Email", "email", "off")}
          {emailErr && <p className="mt-1 text-xs font-medium text-red-700">{emailErr}</p>}
        </div>
        {field("phone", "Phone", "tel", "off")}
      </div>
    </div>
  );
}
