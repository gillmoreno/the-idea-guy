"use client";

import { useState } from "react";
import { useChoreBoard } from "@/lib/ChoreBoardContext";
import { getMemberSecret } from "@/lib/memberSecrets";
import { getEffectivePermissions } from "@/lib/permissions";
import { weekRange } from "@/lib/store";
import { resolveFrequencyLimit } from "@/lib/frequency";
import { CATEGORY_META, Category, Difficulty } from "@/lib/types";
import { formatMoney, formatDate } from "@/lib/format";
import { Avatar, CadencePill, DiffPill, Money, SyncBadge } from "./ui";

export function KidView({ memberId }: { memberId: string }) {
  const { store, sync, version } = useChoreBoard();
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
      <div className="topbar">
        <div className="card-row" style={{ gap: 10 }}>
          <Avatar member={me} />
          <div>
            <h1 style={{ fontSize: 16 }}>Hi, {me.name.split(" ")[0]}!</h1>
            <div className="sub">{family.name}</div>
          </div>
        </div>
        <SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />
      </div>

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

        <div className="spread">
          <div className="section-title">Chores you can do</div>
          {perms.canProposeChores && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSuggesting((s) => !s)}>
              {suggesting ? "Close" : "Suggest one"}
            </button>
          )}
        </div>

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
            <div className="empty">No chores yet — ask a parent to add some.</div>
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
                    <Money amount={c.amount} currency={currency} />
                  )}
                </div>
              ))}
              {myRecent.length === 0 && (
                <div className="empty">Nothing yet. Tap ✓ on a chore!</div>
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
  const { store } = useChoreBoard();
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
