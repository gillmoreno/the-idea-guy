"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  generateMemberId,
  PENDING_TEMPLATE_ID,
  parseJoinLocation,
  roomUrl,
  stripInviteParamsFromUrl,
  type DeepLink,
} from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";
import { QRScanner } from "@/components/QRScanner";

/** Accept an invite link (code in the hash) or a bare room code. */
function normalizeJoinScan(decoded: string): Extract<DeepLink, { type: "join" }> | null {
  const t = decoded.trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    const parsed = parseJoinLocation(url.search, url.hash);
    if (parsed?.type === "join" && parsed.roomCode) return parsed;
    return null;
  } catch {
    /* not a URL */
  }
  if (/\s/.test(t)) return null;
  return { type: "join", roomCode: t };
}

function JoinInner() {
  const router = useRouter();
  const { saveRoom } = useDevice();
  const [code, setCode] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleScan = (parsed: Extract<DeepLink, { type: "join" }>) => {
    setScanning(false);
    setCode(parsed.roomCode);
    if (parsed.adminSecret) setAdminSecret(parsed.adminSecret);
    finishJoin(parsed.roomCode, parsed.adminSecret, parsed.templateId, passphrase || undefined, true);
  };

  useEffect(() => {
    const parsed = parseJoinLocation(window.location.search, window.location.hash);
    if (!parsed || parsed.type !== "join") return;
    stripInviteParamsFromUrl();
    setCode(parsed.roomCode);
    if (parsed.adminSecret) setAdminSecret(parsed.adminSecret);
    if (parsed.roomCode) {
      finishJoin(parsed.roomCode, parsed.adminSecret, parsed.templateId, undefined, true);
    }
  }, []);

  const finishJoin = (
    roomCode: string,
    secret: string | undefined,
    templateId: string | undefined,
    roomPassphrase: string | undefined,
    autoNavigate = false,
  ) => {
    const trimmed = roomCode.trim();
    if (!trimmed) return;
    const memberId = generateMemberId();
    const pp = roomPassphrase?.trim();

    saveRoom({
      roomCode: trimmed,
      templateId: templateId ?? PENDING_TEMPLATE_ID,
      memberId,
      adminSecret: secret?.trim(),
      isOwner: !!secret,
      roomPassphrase: pp || undefined,
      passphraseProtected: !!pp,
      lastOpenedAt: Date.now(),
    });

    if (autoNavigate) router.push(roomUrl(trimmed));
  };

  return (
    <div className="app">
      <div className="topbar">
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1>Join a room</h1>
      </div>
      <div className="app-main stack">
        {scanning ? (
          <QRScanner
            normalize={normalizeJoinScan}
            onScan={handleScan}
            onClose={() => setScanning(false)}
            hint="Point your camera at the room invite QR code"
          />
        ) : (
          <>
        <button type="button" className="btn btn-block" onClick={() => setScanning(true)}>
          Scan invite QR code
        </button>
        <p className="muted" style={{ fontSize: 12, margin: 0, textAlign: "center" }}>
          or paste the invite code
        </p>
        <div className="field">
          <label>Room code</label>
          <input
            className="input"
            placeholder="Paste invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label>Admin secret (optional)</label>
          <input
            className="input"
            placeholder="Only if you were invited as admin"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label>Room passphrase (optional)</label>
          <input
            className="input"
            type="password"
            placeholder="Only if the room owner shared one separately"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={!code.trim()}
          onClick={() => finishJoin(code, adminSecret || undefined, undefined, passphrase || undefined, true)}
        >
          Join room
        </button>
        <p className="muted" style={{ fontSize: 12 }}>
          Member invite = room code only. Passphrase (if any) is shared out-of-band — never in the link.
        </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="centered muted">Loading…</div>}>
      <JoinInner />
    </Suspense>
  );
}
