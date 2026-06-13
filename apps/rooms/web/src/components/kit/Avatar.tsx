/**
 * Avatar — the canonical initials circle.
 *
 * One presentational brick shared by every room (replaces the 20 hand-rolled
 * copies that used to live in each `templates/*\/components/ui.tsx`). Takes plain
 * data: either a `person` object (`{ name, color }`) or explicit `name`/`color`
 * scalars. Renders up to two initials over the person's accent color, with a
 * graceful "?" fallback for unknown / unnamed people (solo-first proxy rows).
 *
 * The glyph is decorative — a name label almost always sits beside it — so it is
 * `aria-hidden`, with the full name exposed as a native `title` tooltip for the
 * initials-only case. Sizing/colors come from the shared `.avatar` token rules
 * in `globals.css`.
 */
export function Avatar({
  person,
  name,
  color,
  large,
  title,
}: {
  /** Plain person data; either pass this or the `name`/`color` scalars. */
  person?: { name?: string | null; color?: string | null } | null;
  name?: string | null;
  color?: string | null;
  large?: boolean;
  /** Tooltip override; defaults to the resolved name. */
  title?: string;
}) {
  const resolvedName = (name ?? person?.name ?? "").trim();
  const resolvedColor = color ?? person?.color ?? undefined;

  const initials = resolvedName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={`avatar ${large ? "lg" : ""}`}
      style={resolvedColor ? { background: resolvedColor } : undefined}
      title={title ?? resolvedName ?? undefined}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
