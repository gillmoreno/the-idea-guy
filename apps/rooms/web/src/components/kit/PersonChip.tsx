/**
 * PersonChip — the canonical inline "who" reference: a color dot + name.
 *
 * One presentational brick for rendering a person inline (attribution meta,
 * "added by", status-by, person fields) so people look the same everywhere and
 * a raw id never leaks. Pass a `person` ({ name, color }); when it can't be
 * resolved, pass the raw id as `fallback` — the chip shows that text with a
 * neutral dot instead of a colored one, so the record is never blank or a crash.
 *
 * Dot/name styling comes from the `.person-chip` tokens in `globals.css`; the dot
 * is `aria-hidden` (the name carries the meaning).
 */
export function PersonChip({
  person,
  name,
  fallback,
  className,
}: {
  /** Resolved person; pass this or an explicit `name`. */
  person?: { name?: string | null; color?: string | null } | null;
  /** Explicit name override (takes precedence over `person.name`). */
  name?: string | null;
  /** Shown when neither `name` nor `person.name` resolves (e.g. a raw id). */
  fallback?: string;
  className?: string;
}) {
  const resolved = (name ?? person?.name ?? fallback ?? "").trim() || "Unknown";
  const color = person?.color ?? undefined;
  return (
    <span className={`person-chip${className ? ` ${className}` : ""}`}>
      <span
        className="person-chip__dot"
        style={color ? { background: color } : undefined}
        aria-hidden
      />
      <span className="person-chip__name">{resolved}</span>
    </span>
  );
}
