"use client";

import { useState } from "react";
import { loadVault } from "@the-idea-guy/room-kit";
import { useVaultLock } from "@/shell/VaultLockProvider";

export function AppLockSettings() {
  const { lockEnabled, enableLock, disableLock, bioAvailable, bioEnabled, enableBio, disableBio } =
    useVaultLock();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [bioPin, setBioPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onEnable = async () => {
    setBusy(true);
    setMessage(null);
    const err = await enableLock(pin, confirmPin);
    if (err) setMessage(err);
    else {
      setPin("");
      setConfirmPin("");
      setMessage("App lock enabled on this device.");
    }
    setBusy(false);
  };

  const onDisable = async () => {
    setBusy(true);
    setMessage(null);
    const ok = await disableLock(currentPin);
    if (!ok) setMessage("Wrong PIN.");
    else {
      setCurrentPin("");
      setMessage("App lock disabled.");
    }
    setBusy(false);
  };

  const onEnableBio = async () => {
    setBusy(true);
    setMessage(null);
    const err = await enableBio(bioPin);
    if (err) setMessage(err);
    else {
      setBioPin("");
      setMessage("Biometric unlock enabled — next unlock can use Face ID / fingerprint.");
    }
    setBusy(false);
  };

  const onDisableBio = () => {
    disableBio();
    setMessage("Biometric unlock turned off. Your PIN still works.");
  };

  return (
    <div className="card stack-sm">
      <strong>App lock (this device)</strong>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Encrypt your room list and keys with a PIN. Free — no server. If you forget the PIN, local
        data on this device cannot be recovered.
      </p>

      {lockEnabled ? (
        <>
          {bioEnabled ? (
            <>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                ✅ Biometric unlock is on — Face ID, Touch ID, or fingerprint opens the vault.
                Your PIN always works as a backup.
              </p>
              <button className="btn btn-block" disabled={busy} onClick={onDisableBio}>
                Turn off biometric unlock
              </button>
            </>
          ) : bioAvailable ? (
            <>
              <div className="field">
                <label>Confirm PIN to add Face ID / fingerprint</label>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  value={bioPin}
                  onChange={(e) => setBioPin(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary btn-block"
                disabled={busy || !bioPin.trim()}
                onClick={() => void onEnableBio()}
              >
                Enable biometric unlock
              </button>
            </>
          ) : null}
          <div className="field">
            <label>Current PIN to disable</label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
            />
          </div>
          <button
            className="btn btn-block"
            disabled={busy || !currentPin.trim()}
            onClick={() => void onDisable()}
          >
            Turn off app lock
          </button>
        </>
      ) : (
        <>
          <div className="field">
            <label>New PIN (4+ characters)</label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Confirm PIN</label>
            <input
              className="input"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-block"
            disabled={busy || pin.trim().length < 4}
            onClick={() => void onEnable()}
          >
            Enable app lock
          </button>
        </>
      )}

      {message ? (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {message}
        </p>
      ) : null}
      {!lockEnabled && loadVault().rooms && Object.keys(loadVault().rooms).length > 0 ? (
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Locks {Object.keys(loadVault().rooms).length} room(s) on this device.
        </p>
      ) : null}
    </div>
  );
}
