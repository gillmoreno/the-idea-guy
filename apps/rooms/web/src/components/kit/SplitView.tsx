import { formatMoney } from "@/templates/choreboard/lib/format";
import { PersonChip } from "./PersonChip";

/**
 * SplitView — who an expense is split between, as structured per-person chips.
 *
 * Replaces the `split: a, b, c` muted text run with a wrapping row of
 * `PersonChip`s, each optionally showing that person's share amount (compute it
 * with `allocateShares` from `@/lib/splitMath` and pass `amountCents` per member
 * + the `currency`). Presentational only — the caller resolves people and
 * amounts. Renders nothing when the member list is empty.
 *
 * Designed to drop into `RecordRow.meta` beneath the primary line. Styling comes
 * from the `.split-view` tokens in `globals.css`.
 */
export function SplitView({
  members,
  currency,
  className,
}: {
  members: Array<{
    id?: string;
    person?: { name?: string | null; color?: string | null } | null;
    name?: string | null;
    fallback?: string;
    /** This member's share in integer cents; shown when `currency` is set. */
    amountCents?: number;
  }>;
  currency?: string;
  className?: string;
}) {
  if (!members.length) return null;
  return (
    <span className={`split-view${className ? ` ${className}` : ""}`}>
      {members.map((m, i) => (
        <span className="split-view__item" key={m.id ?? i}>
          <PersonChip person={m.person} name={m.name} fallback={m.fallback} />
          {m.amountCents != null && currency ? (
            <span className="split-view__amount">{formatMoney(m.amountCents / 100, currency)}</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
