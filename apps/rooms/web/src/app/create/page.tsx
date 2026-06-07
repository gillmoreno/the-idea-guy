"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DECLARATIVE_TEMPLATE_ID,
  generateAdminSecret,
  generateMemberId,
  generateRoomCode,
  roomUrl,
} from "@the-idea-guy/room-kit";
import { useDevice } from "@/shell/DeviceProvider";
import { ThemeSwitcher } from "@/shell/ThemeSwitcher";
import { stashPendingSchema } from "@/schema/pending";
import { parseAndValidateJson } from "@/schema/validate";
import { loadOfficialCatalog } from "@/templates/catalog";
import {
  BUILTIN_TEMPLATES,
  type CatalogTemplateDef,
  type TemplatePick,
  canCreateBuiltin,
  templateIdForPick,
  templateKindForPick,
} from "@/templates/registry";

type CreateMode = "builtin" | "official" | "custom";

const PLACEHOLDERS: Record<string, string> = {
  choreboard: "Our family",
  tripsplit: "Barcelona 2026",
  bookclub: "Tuesday Night Readers",
  backlog: "Rooms ideas",
};

export default function CreatePage() {
  const router = useRouter();
  const { saveRoom } = useDevice();
  const [mode, setMode] = useState<CreateMode>("builtin");
  const [builtinId, setBuiltinId] = useState(BUILTIN_TEMPLATES[0].id);
  const [catalog, setCatalog] = useState<CatalogTemplateDef[]>([]);
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [customJson, setCustomJson] = useState("");
  const [parseIssues, setParseIssues] = useState<string[]>([]);
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    loadOfficialCatalog().then((items) => {
      setCatalog(items);
      if (items[0]) setCatalogId(items[0].id);
    });
  }, []);

  const visibleBuiltins = BUILTIN_TEMPLATES.filter((t) => canCreateBuiltin(t.id));

  const selectedCatalog = useMemo(
    () => catalog.find((c) => c.id === catalogId) ?? catalog[0],
    [catalog, catalogId],
  );

  const selectedBuiltin = useMemo(
    () => visibleBuiltins.find((t) => t.id === builtinId) ?? visibleBuiltins[0],
    [builtinId, visibleBuiltins],
  );

  const accent =
    mode === "builtin"
      ? selectedBuiltin?.accent
      : mode === "official"
        ? selectedCatalog?.accent
        : undefined;

  const validateCustom = () => {
    const result = parseAndValidateJson(customJson);
    setParseIssues(result.issues.map((i) => `${i.path}: ${i.message}`));
    return result;
  };

  const create = () => {
    const roomCode = generateRoomCode();
    const adminSecret = generateAdminSecret();
    const memberId = generateMemberId();

    let pick: TemplatePick | null = null;
    let schemaStash = false;

    if (mode === "builtin" && selectedBuiltin) {
      pick = selectedBuiltin;
    } else if (mode === "official" && selectedCatalog) {
      pick = selectedCatalog;
      stashPendingSchema(roomCode, selectedCatalog.schema);
      schemaStash = true;
    } else if (mode === "custom") {
      const result = validateCustom();
      if (!result.ok || !result.schema) return;
      pick = {
        kind: "declarative",
        id: result.schema.id,
        name: result.schema.name,
        description: result.schema.description ?? "",
        emoji: result.schema.emoji,
        accent: result.schema.accent ?? "#6366f1",
        schema: result.schema,
      };
      stashPendingSchema(roomCode, result.schema);
      schemaStash = true;
    }

    if (!pick) return;

    const name =
      roomName.trim() ||
      (mode === "custom" && pick.kind === "declarative"
        ? pick.schema.name
        : pick.name);

    saveRoom({
      roomCode,
      templateKind: templateKindForPick(pick),
      templateId: templateIdForPick(pick),
      roomName: name,
      memberId,
      adminSecret,
      isOwner: true,
      lastOpenedAt: Date.now(),
    });

    void schemaStash;
    router.push(roomUrl(roomCode));
  };

  const canCreate =
    mode === "builtin"
      ? !!selectedBuiltin
      : mode === "official"
        ? !!selectedCatalog
        : customJson.trim().length > 0;

  return (
    <div
      className="app"
      style={accent ? ({ "--template-accent": accent } as React.CSSProperties) : undefined}
    >
      <div className="topbar">
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1>Create a room</h1>
      </div>
      <div className="app-main stack">
        <ThemeSwitcher compact />

        <div className="section-title">How do you want to start?</div>
        <div className="theme-grid">
          {(
            [
              ["builtin", "Built-in", "Curated apps we ship"],
              ["official", "Official schemas", "From the marketplace"],
              ["custom", "Paste JSON", "Your own or AI-generated"],
            ] as const
          ).map(([id, title, sub]) => (
            <button
              key={id}
              type="button"
              className={`theme-chip${mode === id ? " active" : ""}`}
              onClick={() => setMode(id)}
            >
              <strong>{title}</strong>
              <span className="muted">{sub}</span>
            </button>
          ))}
        </div>

        {mode === "builtin" && (
          <>
            <div className="section-title">Built-in apps</div>
            {visibleBuiltins.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`card row-link template-pick${builtinId === t.id ? " selected" : ""}`}
                style={
                  builtinId === t.id
                    ? ({ "--template-accent": t.accent } as React.CSSProperties)
                    : undefined
                }
                onClick={() => setBuiltinId(t.id)}
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
          </>
        )}

        {mode === "official" && (
          <>
            <div className="section-title">Official schemas</div>
            {catalog.length === 0 && (
              <p className="muted" style={{ fontSize: 13 }}>
                Loading marketplace…
              </p>
            )}
            {catalog.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`card row-link template-pick${catalogId === t.id ? " selected" : ""}`}
                style={
                  catalogId === t.id
                    ? ({ "--template-accent": t.accent } as React.CSSProperties)
                    : undefined
                }
                onClick={() => setCatalogId(t.id)}
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
          </>
        )}

        {mode === "custom" && (
          <div className="card stack">
            <div className="section-title">Paste room schema (JSON)</div>
            <p className="muted" style={{ fontSize: 13 }}>
              Use an AI with the Rooms schema prompt to generate this file, then paste below.
              The schema is stored inside your room — share the room invite to distribute it.
            </p>
            <textarea
              className="input"
              rows={12}
              placeholder='{ "schemaVersion": 1, "id": "my-room", ... }'
              value={customJson}
              onChange={(e) => {
                setCustomJson(e.target.value);
                setParseIssues([]);
              }}
              spellCheck={false}
            />
            {parseIssues.length > 0 && (
              <div className="card" style={{ borderColor: "var(--danger)", fontSize: 13 }}>
                {parseIssues.map((msg) => (
                  <div key={msg}>{msg}</div>
                ))}
              </div>
            )}
            <button className="btn btn-ghost btn-sm" type="button" onClick={validateCustom}>
              Validate JSON
            </button>
          </div>
        )}

        <div className="field">
          <label>Room name</label>
          <input
            className="input"
            placeholder={
              mode === "builtin"
                ? (PLACEHOLDERS[builtinId] ?? "My room")
                : mode === "official"
                  ? (selectedCatalog?.name ?? "My room")
                  : "My room"
            }
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            if (mode === "custom") {
              const result = validateCustom();
              if (!result.ok) return;
            }
            create();
          }}
          disabled={!canCreate}
        >
          Create room
        </button>

        {mode === "custom" && (
          <p className="muted" style={{ fontSize: 12 }}>
            Template id in vault: <code>{DECLARATIVE_TEMPLATE_ID}</code> — full schema syncs
            inside the encrypted room document.
          </p>
        )}
      </div>
    </div>
  );
}
