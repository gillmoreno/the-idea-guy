"use client";

import { useChoreBoard } from "@/lib/ChoreBoardContext";
import { Welcome } from "@/components/Welcome";
import { Setup } from "@/components/Setup";
import { ProfilePicker } from "@/components/ProfilePicker";
import { KidView } from "@/components/KidView";
import { ParentView } from "@/components/ParentView";
import { ParentGate } from "@/components/ParentGate";

function Loading({ message }: { message: string }) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo">🧹💰</div>
      <p className="muted">{message}</p>
    </div>
  );
}

export default function Page() {
  const {
    mounted,
    familyCode,
    hasParentAccess,
    isCreator,
    store,
    sync,
    version,
    relayUrl,
    currentMemberId,
    leave,
  } = useChoreBoard();
  void version;

  if (!mounted) return <Loading message="Starting ChoreBoard…" />;
  if (!familyCode) return <Welcome />;
  if (!store || !sync.localLoaded) return <Loading message="Loading your data…" />;

  if (!store.isInitialized()) {
    if (isCreator && hasParentAccess) return <Setup />;
    return (
      <div className="centered" style={{ textAlign: "center" }}>
        <div className="hero-logo">🔗</div>
        <h1>Connecting to your family…</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 360, marginInline: "auto" }}>
          {sync.connected
            ? "Waiting for a parent to finish first-time setup on their phone, then sync."
            : "Trying to reach the sync relay — check Wi‑Fi or relay settings."}
        </p>
        <div
          className="muted"
          style={{
            marginTop: 16,
            fontSize: 13,
            textAlign: "left",
            maxWidth: 360,
            marginInline: "auto",
            lineHeight: 1.5,
          }}
        >
          <p style={{ marginBottom: 8 }}>
            <strong>One family code for everyone.</strong> After this step you will pick{" "}
            <strong>which kid</strong> is using this device (e.g. Emma vs Noah). You do not
            need a separate code per child.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Parent must:</strong> create the family → complete Setup (names for
            parents and kids) → keep ChoreBoard open for a moment so sync can run.
          </p>
          <p style={{ fontSize: 12 }}>
            Relay: {sync.connected ? "connected" : "not connected"} ·{" "}
            <span style={{ wordBreak: "break-all" }}>{relayUrl}</span>
          </p>
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={leave}>
          Use a different code
        </button>
      </div>
    );
  }

  if (!currentMemberId || !store.getMember(currentMemberId)) {
    return <ProfilePicker />;
  }

  const me = store.getMember(currentMemberId)!;
  if (me.role === "parent" && !hasParentAccess) {
    return <ParentGate />;
  }

  return me.role === "parent" ? (
    <ParentView memberId={me.id} />
  ) : (
    <KidView memberId={me.id} />
  );
}
