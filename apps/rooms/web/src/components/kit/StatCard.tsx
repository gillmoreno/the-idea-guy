import type { ReactNode } from "react";

/**
 * StatCard — a headline summary stat: a big number with an optional label and
 * sub-line.
 *
 * One home for the `card` + `section-title` + inline `fontSize:28/700` big-number
 * pattern the money rooms hand-rolled (trip total, household total, fund total).
 * `tone` color-codes the value via the shared `.amount-pos`/`.amount-neg` tokens
 * for directional figures. Pass `children` for extra content under the stat
 * (e.g. a progress bar). Presentational only.
 */
export function StatCard({
  label,
  value,
  sub,
  tone,
  children,
  className,
}: {
  /** Small uppercase label above the value (rendered as a section title). */
  label?: ReactNode;
  /** The headline number/value. */
  value: ReactNode;
  /** Muted sub-line beneath the value. */
  sub?: ReactNode;
  /** Direction color for the value. */
  tone?: "pos" | "neg";
  /** Extra content under the stat (progress bar, etc.). */
  children?: ReactNode;
  className?: string;
}) {
  const valueCls = `stat-card__value${
    tone === "pos" ? " amount-pos" : tone === "neg" ? " amount-neg" : ""
  }`;
  return (
    <div className={`card stack stat-card${className ? ` ${className}` : ""}`}>
      {label != null ? <div className="section-title">{label}</div> : null}
      <div className={valueCls}>{value}</div>
      {sub != null ? <p className="meta-line">{sub}</p> : null}
      {children}
    </div>
  );
}
