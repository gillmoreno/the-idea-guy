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
    currentMemberId,
    leave,
  } = useChoreBoard();

  if (!mounted) return <Loading message="Starting ChoreBoard…" />;
  if (!familyCode) return <Welcome />;
  if (!store || !sync.localLoaded) return <Loading message="Loading your data…" />;

  if (!store.isInitialized()) {
    if (isCreator && hasParentAccess) return <Setup />;
    return (
      <div className="centered" style={{ textAlign: "center" }}>
        <div className="hero-logo">🔗</div>
        <h1>Connecting to your family…</h1>
        <p className="muted">
          {sync.connected
            ? "Waiting for a parent device to finish setup and sync."
            : "Trying to reach the sync relay."}
        </p>
        <button className="btn btn-ghost" onClick={leave}>
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
