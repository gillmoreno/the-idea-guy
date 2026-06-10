"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DeviceVault,
  disableVaultLock,
  enableVaultLock,
  isVaultLockEnabled,
  loadVault,
  readPlainVaultJson,
  setSessionVault,
  unlockVaultWithPin,
} from "@the-idea-guy/room-kit";

interface VaultLockCtx {
  locked: boolean;
  lockEnabled: boolean;
  unlock: (pin: string) => Promise<boolean>;
  enableLock: (pin: string, confirmPin: string) => Promise<string | null>;
  disableLock: (pin: string) => Promise<boolean>;
}

const Ctx = createContext<VaultLockCtx | null>(null);

export function VaultLockProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockEnabled = mounted && isVaultLockEnabled();

  useEffect(() => {
    setMounted(true);
    if (isVaultLockEnabled()) {
      setLocked(true);
      setSessionVault(null, null);
    } else {
      const raw = readPlainVaultJson();
      if (raw) {
        try {
          setSessionVault(JSON.parse(raw) as DeviceVault, null);
        } catch {
          setSessionVault(null, null);
        }
      }
      setLocked(false);
    }
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const vault = await unlockVaultWithPin(pin);
    if (!vault) return false;
    setSessionVault(vault, pin.trim());
    setLocked(false);
    return true;
  }, []);

  const enableLock = useCallback(async (pin: string, confirmPin: string) => {
    if (pin.trim().length < 4) return "PIN must be at least 4 characters.";
    if (pin !== confirmPin) return "PINs do not match.";
    const vault = loadVault();
    const ok = await enableVaultLock(pin, vault);
    if (!ok) return "Could not enable app lock.";
    setSessionVault(vault, pin.trim());
    setLocked(false);
    return null;
  }, []);

  const disableLock = useCallback(async (pin: string) => {
    const vault = await disableVaultLock(pin);
    if (!vault) return false;
    setSessionVault(vault, null);
    setLocked(false);
    return true;
  }, []);

  const value = useMemo(
    () => ({ locked, lockEnabled, unlock, enableLock, disableLock }),
    [locked, lockEnabled, unlock, enableLock, disableLock],
  );

  if (!mounted) {
    return <div className="centered muted">Starting Rooms…</div>;
  }

  if (locked) {
    return (
      <Ctx.Provider value={value}>
        <VaultUnlockScreen onUnlock={unlock} />
      </Ctx.Provider>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function VaultUnlockScreen({ onUnlock }: { onUnlock: (pin: string) => Promise<boolean> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !pin.trim()) return;
    setBusy(true);
    setError(null);
    const ok = await onUnlock(pin);
    if (!ok) setError("Wrong PIN. Try again.");
    setBusy(false);
  };

  return (
    <div className="app">
      <div className="centered stack" style={{ maxWidth: 360, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Unlock Rooms</h1>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          Enter your device PIN to access your rooms on this device.
        </p>
        <div className="field" style={{ width: "100%" }}>
          <label>PIN</label>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            autoFocus
          />
        </div>
        {error ? (
          <p className="muted" style={{ color: "var(--danger, #dc2626)", fontSize: 13, margin: 0 }}>
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary btn-block" disabled={busy || !pin.trim()} onClick={() => void submit()}>
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </div>
    </div>
  );
}

export function useVaultLock(): VaultLockCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVaultLock must be used within VaultLockProvider");
  return ctx;
}
