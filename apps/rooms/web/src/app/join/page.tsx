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
} from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";

function JoinInner() {
  const router = useRouter();
  const { saveRoom } = useDevice();
  const [code, setCode] = useState("");
  const [adminSecret, setAdminSecret] = useState("");

  useEffect(() => {
    const parsed = parseJoinLocation(window.location.search, window.location.hash);
    if (!parsed || parsed.type !== "join") return;
    stripInviteParamsFromUrl();
    setCode(parsed.roomCode);
    if (parsed.adminSecret) setAdminSecret(parsed.adminSecret);
    if (parsed.roomCode) {
      finishJoin(parsed.roomCode, parsed.adminSecret, parsed.templateId, true);
    }
  }, []);

  const finishJoin = (
    roomCode: string,
    secret: string | undefined,
    templateId: string | undefined,
    autoNavigate = false,
  ) => {
    const trimmed = roomCode.trim();
    if (!trimmed) return;
    const memberId = generateMemberId();

    saveRoom({
      roomCode: trimmed,
      templateId: templateId ?? PENDING_TEMPLATE_ID,
      memberId,
      adminSecret: secret?.trim(),
      isOwner: !!secret,
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
        <button
          className="btn btn-primary btn-block"
          disabled={!code.trim()}
          onClick={() => finishJoin(code, adminSecret || undefined, undefined, true)}
        >
          Join room
        </button>
        <p className="muted" style={{ fontSize: 12 }}>
          Member invite = room code only. Admin invite includes the admin secret (keep it safe).
        </p>
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
