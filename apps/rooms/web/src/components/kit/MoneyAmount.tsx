import { formatMoney } from "@/templates/choreboard/lib/format";

/**
 * MoneyAmount — the canonical money render.
 *
 * One presentational brick shared by every money room (replaces the per-template
 * `Money`/`MoneyCents` copies that lived in `templates/*\/components/ui.tsx`).
 * Formats the value with `formatMoney` and color-codes it by sign: positive in
 * the success token, negative in the danger token, with tabular figures so money
 * columns line up. Pass `amount` in major units, or `cents` for integer-cents
 * stores (e.g. expense/ledger rows) — exactly one of the two.
 *
 * Sign tone uses the shared `.amount-pos` / `.amount-neg` tokens in `globals.css`;
 * the `.money` class adds `tabular-nums`. For amounts always shown as magnitudes
 * (debts, totals) pass an already-absolute value — coloring still follows sign.
 */
export function MoneyAmount({
  amount,
  cents,
  currency,
  className,
}: {
  /** Value in major units (e.g. euros). Pass this OR `cents`. */
  amount?: number;
  /** Value in integer cents; converted to major units. Pass this OR `amount`. */
  cents?: number;
  currency: string;
  className?: string;
}) {
  const value = amount ?? (cents ?? 0) / 100;
  const tone = value < 0 ? "amount-neg" : "amount-pos";
  return (
    <span className={`money ${tone}${className ? ` ${className}` : ""}`}>
      {formatMoney(value, currency)}
    </span>
  );
}
