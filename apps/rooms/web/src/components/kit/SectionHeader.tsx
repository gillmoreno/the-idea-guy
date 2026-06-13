import type { ReactNode } from "react";

/**
 * SectionHeader — a section title with an optional count and a trailing action.
 *
 * One home for the hand-rolled "`.spread`/`.card-row` wrapping a `.section-title`
 * plus a button" header row. Renders the shared `.section-title` styling with the
 * header managing its own row layout (so the title's default margin is dropped).
 * Bare section titles with no action stay as plain `<div className="section-title">`
 * — this brick is for the title+action/count case. Presentational only.
 */
export function SectionHeader({
  title,
  count,
  action,
  className,
}: {
  title: ReactNode;
  /** Optional count shown beside the title (e.g. number of items). */
  count?: ReactNode;
  /** Trailing action, typically a small button. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`section-header${className ? ` ${className}` : ""}`}>
      <div className="section-title section-header__title">
        {title}
        {count != null ? <span className="section-header__count">{count}</span> : null}
      </div>
      {action != null ? <div className="section-header__action">{action}</div> : null}
    </div>
  );
}
