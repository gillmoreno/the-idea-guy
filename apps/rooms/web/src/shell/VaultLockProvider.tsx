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
  disableBiometricUnlock,
  disableVaultLock,
  enableBiometricUnlock,
  enableVaultLock,
  isBiometricUnlockAvailable,
  isBiometricUnlockEnabled,
  isVaultLockEnabled,
  loadVault,
  readPlainVaultJson,
  setSessionVault,
  unlockVaultWithBiometric,
  unlockVaultWithPin,
} from "@the-idea-guy/room-kit";

interface VaultLockCtx {
  locked: boolean;
  lockEnabled: boolean;
  /** Platform authenticator (FaceID / TouchID / Windows Hello) exists on this device. */
  bioAvailable: boolean;
  /** Biometric unlock is enrolled for the vault. */
  bioEnabled: boolean;
  unlock: (pin: string) => Promise<boolean>;
  unlockWithBio: () => Promise<boolean>;
  enableLock: (pin: string, confirmPin: string) => Promise<string | null>;
  disableLock: (pin: string) => Promise<boolean>;
  enableBio: (pin: string) => Promise<string | null>;
  disableBio: () => void;
}

const Ctx = createContext<VaultLockCtx | null>(null);

export function VaultLockProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLockEnabled(isVaultLockEnabled());
    setBioEnabled(isBiometricUnlockEnabled());
    void isBiometricUnlockAvailable().then(setBioAvailable);
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
    const unlocked = await unlockVaultWithPin(pin);
    if (!unlocked) return false;
    setSessionVault(unlocked.vault, unlocked.key);
    setLocked(false);
    return true;
  }, []);

  const unlockWithBio = useCallback(async () => {
    const unlocked = await unlockVaultWithBiometric();
    if (!unlocked) return false;
    setSessionVault(unlocked.vault, unlocked.key);
    setLocked(false);
    return true;
  }, []);

  const enableLock = useCallback(async (pin: string, confirmPin: string) => {
    if (pin.trim().length < 4) return "PIN must be at least 4 characters.";
    if (pin !== confirmPin) return "PINs do not match.";
    const vault = loadVault();
    const key = await enableVaultLock(pin, vault);
    if (!key) return "Could not enable app lock.";
    setSessionVault(vault, key);
    setLockEnabled(true);
    setBioEnabled(false); // fresh lock never carries old biometric enrollment
    setLocked(false);
    return null;
  }, []);

  const disableLock = useCallback(async (pin: string) => {
    const vault = await disableVaultLock(pin);
    if (!vault) return false;
    setSessionVault(vault, null);
    setLockEnabled(false);
    setBioEnabled(false);
    setLocked(false);
    return true;
  }, []);

  const enableBio = useCallback(async (pin: string) => {
    const result = await enableBiometricUnlock(pin);
    if (result === "ok") {
      setBioEnabled(true);
      return null;
    }
    if (result === "wrong-pin") return "Wrong PIN.";
    if (result === "unsupported")
      return "This device doesn't support biometric unlock for Rooms.";
    if (result === "cancelled") return "Biometric setup was cancelled.";
    return "Could not enable biometric unlock.";
  }, []);

  const disableBio = useCallback(() => {
    disableBiometricUnlock();
    setBioEnabled(false);
  }, []);

  const value = useMemo(
    () => ({
      locked,
      lockEnabled,
      bioAvailable,
      bioEnabled,
      unlock,
      unlockWithBio,
      enableLock,
      disableLock,
      enableBio,
      disableBio,
    }),
    [
      locked,
      lockEnabled,
      bioAvailable,
      bioEnabled,
      unlock,
      unlockWithBio,
      enableLock,
      disableLock,
      enableBio,
      disableBio,
    ],
  );

  if (!mounted) {
    return <div className="centered muted">Starting Rooms…</div>;
  }

  if (locked) {
    return (
      <Ctx.Provider value={value}>
        <VaultUnlockScreen
          bioEnabled={bioEnabled}
          onUnlock={unlock}
          onUnlockWithBio={unlockWithBio}
        />
      </Ctx.Provider>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function VaultUnlockScreen({
  bioEnabled,
  onUnlock,
  onUnlockWithBio,
}: {
  bioEnabled: boolean;
  onUnlock: (pin: string) => Promise<boolean>;
  onUnlockWithBio: () => Promise<boolean>;
}) {
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

  const submitBio = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const ok = await onUnlockWithBio();
    if (!ok) setError("Biometric unlock didn't go through. Use your PIN instead.");
    setBusy(false);
  };

  return (
    <div className="app">
      <div className="centered stack" style={{ maxWidth: 360, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Unlock Rooms</h1>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          {bioEnabled
            ? "Use Face ID, Touch ID, or your fingerprint — or enter your device PIN."
            : "Enter your device PIN to access your rooms on this device."}
        </p>
        {bioEnabled ? (
          <button
            className="btn btn-primary btn-block"
            disabled={busy}
            onClick={() => void submitBio()}
          >
            {busy ? "Unlocking…" : "Unlock with Face ID / fingerprint"}
          </button>
        ) : null}
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
            autoFocus={!bioEnabled}
          />
        </div>
        {error ? (
          <p className="muted" style={{ color: "var(--danger, #dc2626)", fontSize: 13, margin: 0 }}>
            {error}
          </p>
        ) : null}
        <button
          className={`btn btn-block${bioEnabled ? "" : " btn-primary"}`}
          disabled={busy || !pin.trim()}
          onClick={() => void submit()}
        >
          {busy ? "Unlocking…" : "Unlock with PIN"}
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
