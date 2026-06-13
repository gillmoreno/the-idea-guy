import type { CSSProperties, ReactNode } from "react";

/**
 * RecordRow — the canonical "actor did X · amount" row card.
 *
 * One presentational container for the record-card shape every room hand-rolled:
 * a `card row gap-sm` wrapper with a leading element (Avatar/PersonChip/icon), a
 * dominant title, an optional secondary meta line, and an optional trailing block
 * (amount/action) bound to the right. Pass `onClick` to make the whole row an
 * accessible button — the keyboard handling and focus ring are centralized here,
 * so consumers stop re-implementing `role="button"`/`onKeyDown` by hand.
 *
 * Presentational only: callers compose the slots (e.g. `<MoneyAmount>` in
 * `trailing`, a structured `MetaLine`/`SplitView` in `meta`). Layout/colors come
 * from the shared `.card`/`.row` + `.record-row` tokens in `globals.css`.
 */
export function RecordRow({
  leading,
  title,
  meta,
  trailing,
  onClick,
  className,
  style,
  ariaLabel,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  /** When set, the whole row renders as an accessible button. */
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  const inner = (
    <>
      {leading}
      <div className="record-row__body">
        <strong className="record-row__title">{title}</strong>
        {meta != null && <div className="record-row__meta">{meta}</div>}
      </div>
      {trailing != null && <div className="record-row__trailing">{trailing}</div>}
    </>
  );

  const cls = `card row gap-sm record-row${className ? ` ${className}` : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        className={`${cls} record-row--clickable`}
        onClick={onClick}
        style={style}
        aria-label={ariaLabel}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={cls} style={style}>
      {inner}
    </div>
  );
}
