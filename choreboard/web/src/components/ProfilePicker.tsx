"use client";

import { useEffect, useState } from "react";
import { useChoreBoard } from "@/lib/ChoreBoardContext";
import { parseAppSearchParams, stripInviteParamsFromUrl } from "@/kit/qr";
import { Avatar } from "./ui";
import {
  getMemberSecret,
  parseMemberLink,
  setMemberSecret,
} from "@/lib/memberSecrets";

export function ProfilePicker() {
  const { store, setCurrentMember } = useChoreBoard();
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkRaw, setLinkRaw] = useState("");

  useEffect(() => {
    const link = parseAppSearchParams(window.location.search);
    if (link?.type !== "member") return;
    stripInviteParamsFromUrl();
    const parsed = parseMemberLink(link.value);
    if (!parsed) return;
    setMemberSecret(parsed.memberId, parsed.memberSecret);
    setCurrentMember(parsed.memberId);
  }, [setCurrentMember]);

  const family = store?.getFamily();
  const members = store?.listMembers() ?? [];

  const pick = (id: string, role: string) => {
    if (role === "kid" && !getMemberSecret(id)) {
      setLinkingId(id);
      return;
    }
    setCurrentMember(id);
  };

  const submitLink = () => {
    if (!linkingId) return;
    const parsed = parseMemberLink(linkRaw);
    if (!parsed || parsed.memberId !== linkingId) {
      alert("Invalid device link for this profile.");
      return;
    }
    setMemberSecret(linkingId, parsed.memberSecret);
    setCurrentMember(linkingId);
    setLinkingId(null);
    setLinkRaw("");
  };

  if (linkingId) {
    const m = store?.getMember(linkingId);
    return (
      <div className="app">
        <div className="topbar">
          <h1>Link {m?.name}&apos;s device</h1>
        </div>
        <div className="app-main stack">
          <p className="muted" style={{ fontSize: 14 }}>
            Paste the <strong>device link</strong> from the parent (Settings → Add member).
            Skip only if this is a shared tablet and you trust anyone on it.
          </p>
          <textarea
            className="input"
            rows={4}
            value={linkRaw}
            onChange={(e) => setLinkRaw(e.target.value)}
            placeholder="Paste device link"
          />
          <button className="btn btn-primary btn-block" disabled={!linkRaw.trim()} onClick={submitLink}>
            Link &amp; continue
          </button>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              setCurrentMember(linkingId);
              setLinkingId(null);
            }}
          >
            Skip (unsigned completions)
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => setLinkingId(null)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        <div>
          <h1>{family?.name ?? "ChoreBoard"}</h1>
          <div className="sub">Who&apos;s using this device?</div>
        </div>
      </div>
      <div className="app-main">
        <div className="profile-grid">
          {members.map((m) => (
            <button key={m.id} className="profile-card" onClick={() => pick(m.id, m.role)}>
              <Avatar member={m} large />
              <div>
                <div className="name">{m.name}</div>
                <div className="role">{m.role === "parent" ? "Parent" : "Kid"}</div>
              </div>
            </button>
          ))}
        </div>
        {members.length === 0 && (
          <div className="empty">No members yet. A parent can add them in Settings.</div>
        )}
      </div>
    </div>
  );
}
