"use client";

import { useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { useChoreStore } from "@/templates/choreboard/lib/useChoreStore";
import {
  formatMemberLink,
  getMemberSecret,
  setMemberSecret,
} from "@/templates/choreboard/lib/memberSecrets";
import { generateMemberSecret } from "@the-idea-guy/room-kit";
import { qrFamilyJoin, qrMemberLink, qrParentUnlock } from "@the-idea-guy/room-kit";
import { QRBlock } from "@/shell/QRBlock";
import { PermissionsSettings } from "./PermissionsSettings";
import { RelaySettings } from "@/shell/RelaySettings";
import { RoomInviteSettings } from "@/shell/RoomInviteSettings";
import { AddPersonByName } from "@/shell/AddPersonByName";
import { RoomLocalStorage } from "@/shell/RoomLocalStorage";
import { Completion } from "@/templates/choreboard/lib/types";
import { weekRange } from "@/templates/choreboard/lib/store";
import { resolveFrequencyLimit } from "@/templates/choreboard/lib/frequency";
import { CATEGORY_META, MEMBER_COLORS, Role } from "@/templates/choreboard/lib/types";
import { formatMoney, formatDate, weekdayName } from "@/templates/choreboard/lib/format";
import { TopbarPersona } from "@/shell/TopbarPersona";
import { BottomNav, BottomNavItem } from "@/shell/BottomNav";
import { CadencePill, DiffPill, SyncBadge } from "./ui";
import { Avatar, MoneyAmount } from "@/components/kit";
import { ChoreForm } from "./ChoreForm";
import { ConfirmModal } from "@/components/ConfirmModal";

type Tab = "home" | "approvals" | "chores" | "payday" | "settings";

export function ParentView({ memberId }: { memberId: string }) {
  const { sync } = useRoomSession();
  const store = useChoreStore();
  const [tab, setTab] = useState<Tab>("home");
  if (!store) return null;
  const family = store.getFamily()!;
  const pendingCount = store.listCompletions({ status: "pending" }).length;
  const proposedCount = store.listProposals().length;
  const approvalBadge = pendingCount + proposedCount;

  return (
    <div className="app">
      <TopbarPersona
        title={family.name}
        subtitle="Parent dashboard"
        trailing={<SyncBadge connected={sync.connected} localLoaded={sync.localLoaded} />}
      />

      <div className="app-main">
        {tab === "home" && <HomeTab />}
        {tab === "approvals" && <ApprovalsTab byId={memberId} />}
        {tab === "chores" && <ChoresTab />}
        {tab === "payday" && <PaydayTab byId={memberId} />}
        {tab === "settings" && <SettingsTab />}
      </div>

      <BottomNav>
        <BottomNavItem label="Home" icon="🏠" active={tab === "home"} onClick={() => setTab("home")} />
        <BottomNavItem
          label="Approvals"
          icon="🔔"
          badge={approvalBadge > 0 ? approvalBadge : undefined}
          active={tab === "approvals"}
          onClick={() => setTab("approvals")}
        />
        <BottomNavItem label="Chores" icon="🧹" active={tab === "chores"} onClick={() => setTab("chores")} />
        <BottomNavItem label="Payday" icon="💰" active={tab === "payday"} onClick={() => setTab("payday")} />
        <BottomNavItem label="Settings" icon="⚙️" active={tab === "settings"} onClick={() => setTab("settings")} />
      </BottomNav>
    </div>
  );
}

function HomeTab() {
  const store = useChoreStore();
  if (!store) return null;
  const currency = store.getFamily()!.currency;
  const kids = store.listMembers().filter((m) => m.role === "kid");
  const { start, end } = weekRange();
  const totalOwed = kids.reduce((s, k) => s + store.balanceFor(k.id), 0);

  return (
    <>
      <div className="balance-hero">
        <div className="label">Total you owe right now</div>
        <div className="amount">{formatMoney(totalOwed, currency)}</div>
        <div className="meta">
          <div>
            Payday<b>{weekdayName(store.getFamily()!.paydayWeekday)}</b>
          </div>
          <div>
            Kids<b>{kids.length}</b>
          </div>
        </div>
      </div>

      <div className="section-title">Your kids</div>
      <div className="stack-sm">
        {kids.map((k) => (
          <div key={k.id} className="card card-row">
            <div className="card-row" style={{ gap: 10 }}>
              <Avatar person={k} />
              <div>
                <div className="title" style={{ fontWeight: 600 }}>{k.name}</div>
                <div className="desc muted" style={{ fontSize: 12 }}>
                  This week: {formatMoney(store.earnedInRange(k.id, start, end), currency)}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12 }} className="muted">Owed</div>
              <MoneyAmount amount={store.balanceFor(k.id)} currency={currency} />
            </div>
          </div>
        ))}
        {kids.length === 0 && <div className="empty">Add kids in Settings to get started.</div>}
      </div>
    </>
  );
}

function ApprovalsTab({ byId }: { byId: string }) {
  const store = useChoreStore();
  const [verifyNote, setVerifyNote] = useState<Record<string, string>>({});
  if (!store) return null;
  const currency = store.getFamily()!.currency;
  const pending = store.listCompletions({ status: "pending" });
  const proposed = store.listProposals();

  const checkAndApprove = async (c: Completion) => {
    const secret = getMemberSecret(c.memberId);
    const ok = await store.verifyCompletion(c, secret);
    if (!ok) {
      setVerifyNote((n) => ({
        ...n,
        [c.id]: secret
          ? "Signature invalid — re-link this kid's device."
          : "No device link on this phone — approve only if you trust this entry.",
      }));
      return;
    }
    store.setCompletionStatus(c.id, "approved", byId);
    setVerifyNote((n) => {
      const next = { ...n };
      delete next[c.id];
      return next;
    });
  };

  return (
    <>
      <div className="section-title">Chores waiting for approval</div>
      <div className="stack-sm">
        {pending.map((c) => {
          const kid = store.getMember(c.memberId);
          return (
            <div key={c.id} className="card stack-sm">
              <div className="spread">
                <div>
                  <div className="title" style={{ fontWeight: 600 }}>{c.label}</div>
                  <div className="desc muted">
                    {kid?.name} · {formatDate(c.date)}
                    {c.sig ? " · signed" : " · unsigned"}
                  </div>
                  {verifyNote[c.id] && (
                    <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      {verifyNote[c.id]}
                    </p>
                  )}
                </div>
                <MoneyAmount amount={c.amount} currency={currency} />
              </div>
              <div className="btn-row">
                <button className="btn btn-success btn-sm" onClick={() => void checkAndApprove(c)}>
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => store.setCompletionStatus(c.id, "rejected", byId)}
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <div className="empty">Nothing waiting. All caught up! 🎉</div>}
      </div>

      {proposed.length > 0 && (
        <>
          <div className="section-title">Chore ideas from kids</div>
          <div className="stack-sm">
            {proposed.map((p) => {
              const kid = store.getMember(p.proposedBy);
              return (
                <div key={p.id} className="card stack-sm">
                  <div className="spread">
                    <div>
                      <div className="title" style={{ fontWeight: 600 }}>
                        {CATEGORY_META[p.category].emoji} {p.title}
                      </div>
                      <div className="desc muted">Suggested by {kid?.name ?? "a kid"}</div>
                    </div>
                    <span className="reward">{formatMoney(p.reward, currency)}</span>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-success btn-sm" onClick={() => store.approveProposal(p.id)}>
                      Add to chores
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => store.dismissProposal(p.id)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function ChoresTab() {
  const store = useChoreStore();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  if (!store) return null;
  const currency = store.getFamily()!.currency;
  const chores = store.listChores({ status: "active" });

  return (
    <>
      <div className="spread">
        <div className="section-title">Chore catalog</div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "+ Add"}
        </button>
      </div>

      {adding && (
        <ChoreForm
          submitLabel="Add chore"
          onSubmit={(d) => {
            store.addChore(d);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="stack-sm">
        {chores.map((c) =>
          editing === c.id ? (
            <ChoreForm
              key={c.id}
              initial={c}
              submitLabel="Save changes"
              onSubmit={(d) => {
                store.updateChore(c.id, d);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
              onArchive={() => {
                store.archiveChore(c.id);
                setEditing(null);
              }}
            />
          ) : (
            <div key={c.id} className="chore chore-parent">
              <span className="emoji">{CATEGORY_META[c.category].emoji}</span>
              <div className="body">
                <div className="title">{c.title}</div>
                {c.description && <div className="chore-subtitle">{c.description}</div>}
                <div className="desc">
                  <DiffPill difficulty={c.difficulty} />
                  <CadencePill limit={resolveFrequencyLimit(c)} />
                  {c.requiresApproval && <span className="meta-pill">Approval</span>}
                </div>
              </div>
              <div className="chore-parent-actions">
                <span className="reward">{formatMoney(c.reward, currency)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c.id)}>
                  Edit
                </button>
              </div>
            </div>
          ),
        )}
        {chores.length === 0 && <div className="empty">No chores yet — add your first one.</div>}
      </div>
    </>
  );
}

function PaydayTab({ byId }: { byId: string }) {
  const store = useChoreStore();
  if (!store) return null;
  const currency = store.getFamily()!.currency;
  const kids = store.listMembers().filter((m) => m.role === "kid");
  const payments = store.listPayments().slice(0, 10);

  return (
    <>
      <div className="section-title">Owed this period</div>
      <div className="stack-sm">
        {kids.map((k) => {
          const owed = store.balanceFor(k.id);
          return (
            <div key={k.id} className="card spread">
              <div className="card-row" style={{ gap: 10 }}>
                <Avatar person={k} />
                <div className="title" style={{ fontWeight: 600 }}>{k.name}</div>
              </div>
              <div className="card-row" style={{ gap: 12 }}>
                <MoneyAmount amount={owed} currency={currency} />
                <button
                  className="btn btn-success btn-sm"
                  disabled={owed <= 0}
                  onClick={() => store.markPaid(k.id, byId)}
                >
                  Pay
                </button>
              </div>
            </div>
          );
        })}
        {kids.length === 0 && <div className="empty">No kids yet.</div>}
      </div>

      <div className="section-title">Payment history</div>
      <div className="card list-divided">
        {payments.map((p) => {
          const kid = store.getMember(p.memberId);
          return (
            <div key={p.id} className="row-item">
              <div className="body" style={{ flex: 1 }}>
                <div className="title" style={{ fontSize: 14 }}>{kid?.name ?? "?"}</div>
                <div className="desc">Paid {formatDate(p.paidDate)}</div>
              </div>
              <MoneyAmount amount={p.total} currency={currency} />
            </div>
          );
        })}
        {payments.length === 0 && <div className="empty">No payments yet.</div>}
      </div>
    </>
  );
}

function SettingsTab() {
  const { roomCode, hasAdminAccess, leaveRoom } = useRoomSession();
  const store = useChoreStore();
  const parentSecret =
    typeof window !== "undefined" ? localStorage.getItem("choreboard.parentSecret") : null;
  const [addingMember, setAddingMember] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!store) return null;
  const family = store.getFamily()!;
  const members = store.listMembers();

  const copy = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="section-title">Codes &amp; devices</div>
      <div className="card stack-sm">
        <p className="meta-line">
          <strong>Family code</strong> — same code for every kid. After scanning, they
          pick their name on the next screen. Finish Setup here first or their device
          stays on &quot;Connecting…&quot;.
        </p>
        <div className="code-box">{roomCode}</div>
        {roomCode && (
          <QRBlock value={qrFamilyJoin(roomCode)} label="Scan to join (kid device)" />
        )}
        <button className="btn btn-block" onClick={copy}>
          {copied ? "Copied!" : "Copy family code"}
        </button>
        {hasAdminAccess && parentSecret && (
          <>
            <p className="meta-line" style={{ marginTop: 12 }}>
              <strong>Parent secret</strong> — only for parents. Unlocks chore catalog,
              payday, and settings. Never share with kids.
            </p>
            <div className="code-box" style={{ fontSize: 14 }}>
              {parentSecret}
            </div>
            <QRBlock value={qrParentUnlock(parentSecret)} label="Scan to unlock parent mode" />
          </>
        )}
      </div>

      <PermissionsSettings />

      <RelaySettings />

      <RoomInviteSettings
        title="Invite co-parents"
        memberColors={MEMBER_COLORS}
        hint="Invite other parents from your contacts. They join with parent access after accepting."
        onReserveMembers={(slots) => {
          for (const slot of slots) {
            store.addMember({
              id: slot.slotId,
              name: slot.name,
              role: "parent",
              color: slot.color,
            });
          }
        }}
      />

      <div className="section-title">Add kid by name</div>
      <div className="card stack-sm">
        <AddPersonByName
          placeholder="Kid's name"
          hint="Kids don't need their own device — they can mark chores done from yours, or join later and tap their name."
          existingNames={members.map((m) => m.name)}
          colors={MEMBER_COLORS}
          onAdd={(p) => store.addMember({ name: p.name, color: p.color, role: "kid" })}
        />
      </div>

      <div className="spread">
        <div className="section-title">Members</div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddingMember((a) => !a)}>
          {addingMember ? "Close" : "+ Add"}
        </button>
      </div>
      {addingMember && <AddMember onDone={() => setAddingMember(false)} />}
      <div className="card list-divided">
        {members.map((m) => (
          <div key={m.id} className="row-item">
            <Avatar person={m} />
            <div className="body" style={{ flex: 1 }}>
              <div className="title" style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
              <div className="desc">{m.role === "parent" ? "Parent" : "Kid"}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => store.removeMember(m.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="section-title">Family</div>
      <FamilySettings />

      <RoomLocalStorage
        roomCode={roomCode ?? ""}
        includeAdmin={hasAdminAccess}
        variant="card"
      />

      <ResetHistorySection />

      <button className="btn btn-danger btn-block" style={{ marginTop: 8 }} onClick={leaveRoom}>
        Sign out of this device
      </button>
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>
        Family: {family.name}. Your data lives on your devices and syncs end-to-end encrypted.
      </p>
    </>
  );
}

function ResetHistorySection() {
  const store = useChoreStore();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  if (!store) return null;

  const completionCount = store.listCompletions().length;
  const paymentCount = store.listPayments().length;

  return (
    <>
      <div className="section-title">Data</div>
      <div className="card form-danger-zone" style={{ margin: 0 }}>
        <div className="form-danger-label">Start over</div>
        <p className="form-hint" style={{ marginBottom: 12 }}>
          Clears all chore completions, balances, and payment history. Your chore catalog,
          members, and settings stay intact. Useful while experimenting.
        </p>
        <button
          className="btn btn-danger-outline btn-block"
          disabled={completionCount === 0 && paymentCount === 0}
          onClick={() => setStep(1)}
        >
          Reset all history
        </button>
        {completionCount === 0 && paymentCount === 0 && (
          <p className="form-hint" style={{ marginTop: 8, textAlign: "center" }}>
            Nothing to reset yet.
          </p>
        )}
      </div>

      <ConfirmModal
        open={step === 1}
        variant="danger"
        icon="🔄"
        title="Start over?"
        message={
          <>
            This will erase <strong>{completionCount} completions</strong>
            {paymentCount > 0 && (
              <>
                {" "}
                and <strong>{paymentCount} payments</strong>
              </>
            )}
            . All kids&apos; balances go back to zero. Your chores and family setup are not
            affected.
          </>
        }
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onCancel={() => setStep(0)}
        onConfirm={() => setStep(2)}
      />

      <ConfirmModal
        open={step === 2}
        variant="danger"
        icon="🗑️"
        title="This cannot be undone"
        message={
          <>
            All chore history and payment records will be <strong>lost forever</strong>. There is
            no backup and no way to recover this data from the app.
          </>
        }
        confirmLabel="Yes, erase everything"
        cancelLabel="Go back"
        onCancel={() => setStep(0)}
        onConfirm={() => {
          store.resetHistory();
          setStep(0);
        }}
      />
    </>
  );
}

function FamilySettings() {
  const store = useChoreStore();
  if (!store) return null;
  const family = store.getFamily()!;
  return (
    <div className="card grid-2">
      <div className="field">
        <label>Payday</label>
        <select
          className="select"
          value={family.paydayWeekday}
          onChange={(e) => store.updateFamily({ paydayWeekday: Number(e.target.value) })}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <option key={d} value={d}>{weekdayName(d)}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Family name</label>
        <input
          className="input"
          defaultValue={family.name}
          onBlur={(e) => store.updateFamily({ name: e.target.value })}
        />
      </div>
    </div>
  );
}

function AddMember({ onDone }: { onDone: () => void }) {
  const store = useChoreStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("kid");
  const [color, setColor] = useState(MEMBER_COLORS[2]);
  const [link, setLink] = useState<string | null>(null);
  if (!store) return null;

  if (link) {
    return (
      <div className="card stack-sm">
        <p className="meta-line">
          On the kid&apos;s phone: pick their profile, paste this <strong>device link</strong>{" "}
          (once). It lets them sign completions cryptographically.
        </p>
        <div className="code-box" style={{ fontSize: 11, wordBreak: "break-all" }}>
          {link}
        </div>
        <QRBlock value={qrMemberLink(link)} label="Kid scans to link this device" size={140} />
        <button
          className="btn btn-block"
          onClick={() => void navigator.clipboard.writeText(link)}
        >
          Copy device link
        </button>
        <button className="btn btn-ghost btn-block" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="card stack-sm">
      <div className="grid-2">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="kid">Kid</option>
          <option value="parent">Parent</option>
        </select>
      </div>
      <div className="btn-row">
        {MEMBER_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label="color"
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: c,
              border: color === c ? "3px solid #1f2433" : "2px solid #fff",
              boxShadow: "0 0 0 1px var(--border)",
            }}
          />
        ))}
      </div>
      <button
        className="btn btn-primary btn-block"
        disabled={!name.trim()}
        onClick={() => {
          const m = store.addMember({ name: name.trim(), role, color });
          if (role === "kid") {
            const secret = generateMemberSecret();
            setMemberSecret(m.id, secret);
            setLink(formatMemberLink(m.id, secret));
          } else {
            onDone();
          }
        }}
      >
        Add member
      </button>
    </div>
  );
}
