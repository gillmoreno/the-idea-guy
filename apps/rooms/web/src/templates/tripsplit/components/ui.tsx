"use client";

import { formatMoney } from "@/templates/choreboard/lib/format";

export function Money({ amount, currency }: { amount: number; currency: string }) {
  const cls = amount < 0 ? "amount-neg" : amount >= 0 ? "amount-pos" : "";
  return <span className={cls}>{formatMoney(amount, currency)}</span>;
}

export function MoneyCents({ cents, currency }: { cents: number; currency: string }) {
  return <Money amount={cents / 100} currency={currency} />;
}

