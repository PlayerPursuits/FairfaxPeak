/** What an inline edit changes: a site-text key, a community field, or an "About the area" card field. */
export type EditTarget =
  | { kind: "text"; key: string }
  | { kind: "community"; field: "tagline" | "description" }
  | { kind: "highlight"; id: string; field: "title" | "body" };
