"use client";

import { formatMoney } from "@/templates/choreboard/lib/format";
import { computeBalances, simplifyDebts } from "@/lib/splitMath";
import type { LedgerEntry, Roommate } from "../lib/types";
import { useRoomLedgerStore } from "../lib/useRoomLedgerStore";
import { MoneyCents } from "./ui";
import { Avatar } from "@/components/kit";

export function BalancesPanel({
  roommates,
  entries,
  currency,
  currentMemberId,
}: {
  roommates: Roommate[];
  entries: LedgerEntry[];
  currency: string;
  currentMemberId: string;
}) {
  const store = useRoomLedgerStore();
  const byId = new Map(roommates.map((r) => [r.id, r]));
  const memberIds = roommates.map((r) => r.id);
  const balances = computeBalances(entries, memberIds);
  const debts = simplifyDebts(balances);

  const totalSpentCents = entries
    .filter((e) => e.kind !== "settlement")
    .reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="stack">
      <div className="card stack">
        <div className="section-title">Household total</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {formatMoney(totalSpentCents / 100, currency)}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Shared spending so far — settle-ups not counted.
        </p>
      </div>

      <div className="section-title">Balances</div>
      {balances.every((b) => b.netCents === 0) ? (
        <div className="empty">Everyone is settled up. 🎉</div>
      ) : (
        <div className="stack-sm">
          {balances
            .filter((b) => b.netCents !== 0)
            .map((b) => {
              const r = byId.get(b.memberId);
              if (!r) return null;
              return (
                <div key={b.memberId} className="card row gap-sm">
                  <Avatar person={r} />
                  <div style={{ flex: 1 }}>
                    <strong>{r.name}</strong>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {b.netCents > 0 ? "gets back" : "owes"}
                    </div>
                  </div>
                  <MoneyCents cents={Math.abs(b.netCents)} currency={currency} />
                </div>
              );
            })}
        </div>
      )}

      {debts.length > 0 && (
        <>
          <div className="section-title">Settle up</div>
          <p className="muted" style={{ fontSize: 13 }}>
            Minimum transfers to balance the house. Pay outside the app, then mark it paid —
            the payment is recorded and balances clear.
          </p>
          <div className="stack-sm">
            {debts.map((d, i) => {
              const from = byId.get(d.fromId);
              const to = byId.get(d.toId);
              if (!from || !to) return null;
              return (
                <div key={i} className="card row gap-sm" style={{ alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{from.name}</strong>
                    <span className="muted"> owes </span>
                    <strong>{to.name}</strong>
                    <div style={{ marginTop: 4 }}>
                      <MoneyCents cents={d.amountCents} currency={currency} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      store?.addSettlement({
                        fromId: d.fromId,
                        toId: d.toId,
                        amountCents: d.amountCents,
                        createdById: currentMemberId,
                      })
                    }
                  >
                    Mark paid
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
