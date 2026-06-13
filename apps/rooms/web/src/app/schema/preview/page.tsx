"use client";

import { useMemo, useState } from "react";
import { RecordCard } from "@/schema/engine/RecordCard";
import { EXAMPLE_SCHEMAS } from "@/schema/examples";
import { THEMES, type ThemeId } from "@/shell/themes";
import type { CollectionDef, FeatureDef, SchemaRecord } from "@/schema/types";

const FIXTURE_CASES: {
  id: string;
  label: string;
  schemaId: string;
  collectionId: string;
  record: SchemaRecord;
}[] = [
  {
    id: "watch-long-title",
    label: "Watch Club — long title + tags",
    schemaId: "watch-club",
    collectionId: "shows",
    record: {
      id: "r_preview_1",
      collectionId: "shows",
      createdAt: Date.now(),
      createdById: "m_test",
      status: "queued",
      fields: {
        title: "Whatever this watch club picks next should wrap cleanly",
        emoji: "🍿",
        pitch: "Don't know yet — friends vote tonight.",
        platform: ["Netflix", "HBO"],
      },
    },
  },
  {
    id: "brick-full",
    label: "Brick fixture — all field types",
    schemaId: "brick-fixture",
    collectionId: "items",
    record: {
      id: "r_preview_2",
      collectionId: "items",
      createdAt: Date.now(),
      createdById: "m_test",
      status: "open",
      fields: {
        title: "Long title that must not overlap emoji or vote button",
        emoji: "🎬",
        notes: "Multi-line notes.\nSecond line for textarea brick.",
        labels: ["alpha", "beta", "gamma"],
        cost: "84.50",
        due: "2026-06-20",
        people: ["Alice", "Bob", "Carol"],
      },
    },
  },
  {
    id: "minimal",
    label: "Minimal — title only",
    schemaId: "weekend-plans",
    collectionId: "plans",
    record: {
      id: "r_preview_3",
      collectionId: "plans",
      createdAt: Date.now(),
      createdById: "m_test",
      fields: {
        title: "Beach day",
        details: "Bring snacks.",
      },
    },
  },
];

function getCollection(schemaId: string, collectionId: string): CollectionDef | null {
  const schema = EXAMPLE_SCHEMAS.find((e) => e.schema.id === schemaId)?.schema;
  return schema?.collections.find((c) => c.id === collectionId) ?? null;
}

export default function SchemaPreviewPage() {
  const [theme, setTheme] = useState<ThemeId>("classic");

  const cases = useMemo(
    () =>
      FIXTURE_CASES.map((c) => ({
        ...c,
        collection: getCollection(c.schemaId, c.collectionId),
        schema: EXAMPLE_SCHEMAS.find((e) => e.schema.id === c.schemaId)?.schema,
      })).filter((c) => c.collection && c.schema),
    [],
  );

  return (
    <div className="app" data-schema-preview-root>
      <div className="topbar">
        <h1>Schema UI preview</h1>
      </div>
      <div className="app-main stack" data-theme={theme}>
        <p className="muted" style={{ fontSize: 13 }}>
          QA target for <code>npm run qa:schema-ui</code> — no room sync required.
        </p>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-chip${theme === t.id ? " active" : ""}`}
              onClick={() => {
                setTheme(t.id);
                document.documentElement.dataset.theme = t.id;
              }}
            >
              <strong>{t.name}</strong>
            </button>
          ))}
        </div>
        {cases.map((c) => {
          const statusFeat = c.schema!.features?.find(
            (f): f is Extract<FeatureDef, { type: "status" }> =>
              f.type === "status" && f.collection === c.collectionId,
          );
          const statusValues = statusFeat?.values ?? [];
          const voteFeature = !!c.schema!.features?.some(
            (f) => f.type === "votes" && "collection" in f && f.collection === c.collectionId,
          );

          return (
            <section key={c.id} className="stack-sm" data-schema-fixture={c.id}>
              <div className="section-title">{c.label}</div>
              <RecordCard
                record={c.record}
                collection={c.collection!}
                voteFeature={voteFeature}
                votes={2}
                voted={false}
                onToggleVote={() => {}}
                canSetStatus={statusValues.length > 0}
                statusValues={statusValues}
                status={c.record.status}
                onStatusChange={() => {}}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
