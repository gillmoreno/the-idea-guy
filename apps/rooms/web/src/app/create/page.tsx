"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  generateAdminSecret,
  generateMemberId,
  generateRoomCode,
  roomUrl,
} from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";
import { ThemeSwitcher } from "@/shell/ThemeSwitcher";
import { TEMPLATES, getTemplate } from "@/templates/registry";

const PLACEHOLDERS: Record<string, string> = {
  choreboard: "Our family",
  tripsplit: "Barcelona 2026",
  bookclub: "Tuesday Night Readers",
  backlog: "Rooms ideas",
};

export default function CreatePage() {
  const router = useRouter();
  const { saveRoom } = useDevice();
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [roomName, setRoomName] = useState("");

  const selected = useMemo(() => getTemplate(templateId), [templateId]);

  const create = () => {
    const roomCode = generateRoomCode();
    const adminSecret = generateAdminSecret();
    const memberId = generateMemberId();
    const name = roomName.trim() || selected?.name || "My room";

    saveRoom({
      roomCode,
      templateId,
      roomName: name,
      memberId,
      adminSecret,
      isOwner: true,
      lastOpenedAt: Date.now(),
    });

    router.push(roomUrl(roomCode));
  };

  return (
    <div className="app" style={selected ? ({ "--template-accent": selected.accent } as React.CSSProperties) : undefined}>
      <div className="topbar">
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1>Create a room</h1>
      </div>
      <div className="app-main stack">
        <ThemeSwitcher compact />

        <div className="section-title">Pick a template</div>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`card row-link template-pick${templateId === t.id ? " selected" : ""}`}
            style={
              templateId === t.id
                ? ({ "--template-accent": t.accent } as React.CSSProperties)
                : undefined
            }
            onClick={() => setTemplateId(t.id)}
          >
            <span className="emoji-orb sm">{t.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <strong>{t.name}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                {t.description}
              </div>
            </div>
          </button>
        ))}

        <div className="field">
          <label>Room name</label>
          <input
            className="input"
            placeholder={PLACEHOLDERS[templateId] ?? "My room"}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-block" onClick={create}>
          Create room
        </button>
      </div>
    </div>
  );
}
