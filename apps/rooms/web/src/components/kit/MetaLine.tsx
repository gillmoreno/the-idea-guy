import { createElement, type ReactNode } from "react";

/**
 * MetaLine — the canonical secondary/meta line (muted, small).
 *
 * One home for the `.muted` + 13px secondary line every room hand-rolled with an
 * inline `style={{ fontSize: 13 }}`. Pass `items` to render structured segments
 * joined by a consistent ` · ` separator (falsy entries dropped, so conditional
 * segments compose cleanly) — this is what replaces the `a · b · c` text-run
 * anti-pattern. Or pass `children` for a single muted line. Presentational only;
 * styling lives in the `.meta-line` token in `globals.css`.
 */
export function MetaLine({
  items,
  children,
  as = "div",
  className,
}: {
  /** Segments joined by " · "; null/false/undefined/"" are dropped. Use this OR children. */
  items?: ReactNode[];
  children?: ReactNode;
  as?: "div" | "span" | "p";
  className?: string;
}) {
  const cls = `meta-line${className ? ` ${className}` : ""}`;

  let content: ReactNode = children;
  if (items) {
    const kept = items.filter((x) => x !== null && x !== undefined && x !== false && x !== "");
    content = kept.map((item, i) => (
      <span className="meta-line__seg" key={i}>
        {i > 0 ? (
          <span className="meta-line__sep" aria-hidden>
            {" · "}
          </span>
        ) : null}
        {item}
      </span>
    ));
  }

  return createElement(as, { className: cls }, content);
}
