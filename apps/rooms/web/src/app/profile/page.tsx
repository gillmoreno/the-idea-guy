"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccentColorField } from "@/components/AccentColorField";
import { AvatarField } from "@/components/AvatarField";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { serializeAvatarValue } from "@/lib/avatarValue";
import { DEFAULT_ACCENT } from "@/lib/accentValue";
import { isBackgroundRoomSyncEnabled } from "@the-idea-guy/room-kit";
import { usePersonaContacts } from "@/shell/PersonaContactsProvider";
import { useDevice } from "@/shell/DeviceProvider";
import { ThemeSwitcher } from "@/shell/ThemeSwitcher";

export default function ProfilePage() {
  const router = useRouter();
  const { persona, updatePersona } = usePersonaContacts();
  const { vault, setBackgroundRoomSyncEnabled } = useDevice();
  const backgroundSyncOn = isBackgroundRoomSyncEnabled(vault);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_ACCENT);
  const [avatar, setAvatar] = useState(() =>
    serializeAvatarValue({ kind: "emoji", emoji: "😊" }),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!persona) return;
    setName(persona.displayName);
    setColor(persona.color || DEFAULT_ACCENT);
    setAvatar(
      persona.avatar ?? serializeAvatarValue({ kind: "emoji", emoji: "😊" }),
    );
  }, [persona]);

  if (!persona) return null;

  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      updatePersona({
        displayName: name.trim(),
        avatar,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="topbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.back()}>
          Back
        </button>
        <h1 style={{ flex: 1, textAlign: "center", fontSize: 17 }}>Profile</h1>
        <Link href="/" className="btn btn-ghost btn-sm">
          Home
        </Link>
      </div>

      <div className="app-main stack">
        <div className="card stack-sm" style={{ alignItems: "center", textAlign: "center" }}>
          <PersonaAvatar
            displayName={name || persona.displayName}
            color={color}
            avatar={avatar}
            size="lg"
          />
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Shown in room headers and to connected contacts.
          </p>
        </div>

        <div className="card stack">
          <div className="field">
            <label>Display name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCapitalize="words"
            />
          </div>
          <div className="field">
            <label>Avatar</label>
            <AvatarField
              value={avatar}
              onChange={setAvatar}
              displayName={name}
              color={color}
            />
          </div>
          <button
            className="btn btn-primary btn-block"
            disabled={!name.trim() || busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : saved ? "Saved!" : "Save profile"}
          </button>
        </div>

        <ThemeSwitcher />

        <div className="card stack-sm">
          <div className="row gap-sm" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <strong>Check rooms on home</strong>
              <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
                While the home screen is open, pull updates for your rooms and show an
                &ldquo;Updated&rdquo; badge when something changed. No push notifications — you
                need to open Rooms.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={backgroundSyncOn}
                onChange={(e) => setBackgroundRoomSyncEnabled(e.target.checked)}
              />
              <span className="toggle-switch__track" aria-hidden />
            </label>
          </div>
        </div>

        <div className="card stack-sm">
          <AccentColorField
            value={color}
            label="Accent color"
            onChange={(css) => {
              setColor(css);
              updatePersona({ color: css });
            }}
          />
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Primary buttons, links, and highlights across Rooms on this device. Works with any
            Look &amp; feel theme.
          </p>
        </div>

        <Link className="btn btn-block" href="/contacts">
          Contacts &amp; friend requests
        </Link>
      </div>
    </div>
  );
}
