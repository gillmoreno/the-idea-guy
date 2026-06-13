import type { ReactNode } from "react";

/**
 * EmptyState — the canonical teaching empty state.
 *
 * One presentational home for the `<div className="empty">…</div>` blocks every
 * room hand-rolled. Renders through the shared `.empty` token (so a bare
 * `<EmptyState>message</EmptyState>` is visually identical to the old div), and
 * adds optional slots for a decorative `icon`, a bold `title`, and a primary
 * `action` button — the solo-first "here's the one thing to do first" CTA. Use
 * it for the empty branch of any list; loading/unknown states stay with their
 * own treatments.
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  /** Decorative leading glyph (emoji or node). */
  icon?: ReactNode;
  /** Optional bold headline above the message. */
  title?: ReactNode;
  /** The teaching message — what this list is and how it fills. */
  children?: ReactNode;
  /** Primary action(s) — the first thing to do (solo-first first run). */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`empty${className ? ` ${className}` : ""}`}>
      {icon != null ? (
        <div className="empty__icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      {title != null ? <div className="empty__title">{title}</div> : null}
      {children != null ? <div className="empty__msg">{children}</div> : null}
      {action != null ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
