"use client";

import { useSecondBrain } from "@/lib/SecondBrainContext";
import { Welcome } from "@/components/Welcome";
import { Setup } from "@/components/Setup";
import { VaultApp } from "@/components/VaultApp";

function Loading({ message }: { message: string }) {
  return (
    <div className="centered" style={{ textAlign: "center" }}>
      <div className="hero-logo">🧠</div>
      <p className="muted">{message}</p>
    </div>
  );
}

export default function Page() {
  const { mounted, inviteCode, isCreator, store, sync, leave } = useSecondBrain();

  if (!mounted) return <Loading message="Starting Second Brain…" />;
  if (!inviteCode) return <Welcome />;
  if (!store || !sync.localLoaded) return <Loading message="Loading your vault…" />;

  if (!store.isInitialized()) {
    if (isCreator) return <Setup />;
    return (
      <div className="centered" style={{ textAlign: "center" }}>
        <div className="hero-logo">🔗</div>
        <h1>Connecting to your vault…</h1>
        <p className="muted">
          {sync.connected
            ? "Waiting for a device that's already set up to come online and sync."
            : "Trying to reach the sync relay. This works as soon as another device is online."}
        </p>
        <button className="btn btn-ghost" onClick={leave}>
          Use a different code
        </button>
      </div>
    );
  }

  return <VaultApp />;
}
