"use client";

import { useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { useChoreStore } from "@/templates/choreboard/lib/useChoreStore";
import { getMemberSecret } from "@/templates/choreboard/lib/memberSecrets";
import { getEffectivePermissions } from "@/templates/choreboard/lib/permissions";
import { weekRange } from "@/templates/choreboard/lib/store";
import { resolveFrequencyLimit } from "@/templates/choreboard/lib/frequency";
import { CATEGORY_META, Category, Difficulty } from "@/templates/choreboard/lib/types";
import { formatMoney, formatDate } from "@/templates/choreboard/lib/format";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { CadencePill, DiffPill, SyncBadge } from "./ui";
import { EmptyState, MoneyAmount, SectionHeader } from "@/components/kit";

export function KidView({ memberId }: { memberId: string }) {
  const { sync, version } = useRoomSession();
  const store = useChoreStore();
  const [suggesting, setSuggesting] = useState(false);
  if (!store) return null;
  void version;

  const family = store.getFamily()!;
  const me = store.getMember(memberId);
  if (!me) return null;

  const perms = getEffectivePermissions(store, memberId);
  const currency = family.currency;
  const balance = store.balanceFor(memberId);
  const pending = store.pendingTotalFor(memberId);
  const { start, end } = weekRange();
  const thisWeek = store.earnedInRange(memberId, start, end);

  const chores = store.listChores({ status: "active" });
  const myRecent = store.listCompletions({ memberId }).slice(0, 8);

  const showBalance =
    perms.seeOwnBalance || perms.seePendingBalance || perms.seeWeekEarnings;

  return (
    <div className="app">
      <TopbarPersona
        title={`Hi, ${me.name.split(" ")[0]}!`}
        subtitle={family.name}
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <div className="app-main">
        {showBalance && (
          <div className="balance-hero">
            <div className="label">Your money so far</div>
            {perms.seeOwnBalance ? (
              <div className="amount">{formatMoney(balance, currency)}</div>
            ) : (
              <div className="amount" style={{ fontSize: 22 }}>
                —
              </div>
            )}
            <div className="meta">
              {perms.seePendingBalance && (
                <div>
                  Waiting approval<b>{formatMoney(pending, currency)}</b>
                </div>
              )}
              {perms.seeWeekEarnings && (
                <div>
                  This week<b>{formatMoney(thisWeek, currency)}</b>
                </div>
              )}
            </div>
          </div>
        )}

        <SectionHeader
          title="Chores you can do"
          action={
            perms.canProposeChores ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setSuggesting((s) => !s)}>
                {suggesting ? "Close" : "Suggest one"}
              </button>
            ) : undefined
          }
        />

        {suggesting && perms.canProposeChores && (
          <SuggestChore
            memberId={memberId}
            showRewards={perms.seeChoreRewards}
            onDone={() => setSuggesting(false)}
          />
        )}

        <div className="stack-sm">
          {chores.map((c) => {
            const avail = store.canMarkDone(c.id, memberId);
            const cadence = resolveFrequencyLimit(c);
            return (
              <div key={c.id} className="chore">
                <span className="emoji">{CATEGORY_META[c.category].emoji}</span>
                <div className="body">
                  <div className="title">{c.title}</div>
                  <div className="desc">
                    <DiffPill difficulty={c.difficulty} />
                    <CadencePill limit={cadence} />
                  </div>
                </div>
                {perms.seeChoreRewards && (
                  <span className="reward">{formatMoney(c.reward, currency)}</span>
                )}
                {perms.canMarkDone && (
                  <button
                    className="btn-done"
                    aria-label={avail.ok ? "Mark done" : "Already done"}
                    disabled={!avail.ok}
                    onClick={() =>
                      void store.markDone(c.id, memberId, getMemberSecret(memberId))
                    }
                  >
                    ✓
                  </button>
                )}
              </div>
            );
          })}
          {chores.length === 0 && (
            <EmptyState>No chores yet — ask a parent to add some.</EmptyState>
          )}
        </div>

        {perms.seeActivityHistory && (
          <>
            <div className="section-title">Your recent activity</div>
            <div className="card list-divided">
              {myRecent.map((c) => (
                <div key={c.id} className="row-item">
                  <div className="body" style={{ flex: 1 }}>
                    <div className="title" style={{ fontSize: 14 }}>{c.label}</div>
                    <div className="desc">{formatDate(c.date)}</div>
                  </div>
                  <span className={`tag ${c.kind === "penalty" ? "penalty" : c.status}`}>
                    {c.kind === "penalty" ? "Penalty" : c.status}
                  </span>
                  {perms.seeChoreRewards && (
                    <MoneyAmount amount={c.amount} currency={currency} />
                  )}
                </div>
              ))}
              {myRecent.length === 0 && (
                <EmptyState>Nothing yet. Tap ✓ on a chore!</EmptyState>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SuggestChore({
  memberId,
  showRewards,
  onDone,
}: {
  memberId: string;
  showRewards: boolean;
  onDone: () => void;
}) {
  const store = useChoreStore();
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("1");
  const [category, setCategory] = useState<Category>("general");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const submit = () => {
    if (!store || !title.trim()) return;
    store.proposeChore({
      title: title.trim(),
      category,
      difficulty,
      reward: showRewards ? Number(reward) || 0 : 0,
      proposedBy: memberId,
    });
    onDone();
  };

  return (
    <div className="card stack-sm">
      <div className="field">
        <label>Chore idea</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Wash the car"
        />
      </div>
      <div className={showRewards ? "grid-2" : ""}>
        {showRewards && (
          <div className="field">
            <label>Suggested reward</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.5"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label>Category</label>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.emoji} {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className="btn btn-primary btn-block" disabled={!title.trim()} onClick={submit}>
        Send to parents for approval
      </button>
    </div>
  );
}
