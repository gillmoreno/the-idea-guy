"use client";

import { useState } from "react";
import { useRoomSession } from "@/shell/RoomSessionProvider";
import { downloadTextFile } from "@/lib/downloadFile";
import { buildRoomSnapshot, snapshotToCsv } from "@/lib/roomExport";

/**
 * ExportData — the shared "download my room" brick.
 *
 * Generic over every room (builtin or declarative): it reads the room's Yjs docs
 * straight from the session and serializes them. JSON is a complete backup; CSV
 * is a spreadsheet-friendly flatten. Surfaced inside RoomInviteSettings (admin
 * area), so it appears in every room without per-template wiring.
 *
 * This is the data safety net that must ship before any built-in template is
 * retired in the schema-convergence work (SCHEMA_CONVERGENCE.md, item E0).
 */
export function ExportData() {
  const { docs, roomCode, roomName, roomMeta, templateId, templateKind, hasAdminAccess } =
    useRoomSession();
  const [done, setDone] = useState<null | "json" | "csv">(null);

  if (!docs?.publicDoc) return null;

  const baseName = templateId ?? roomMeta?.templateId ?? roomCode ?? "room";
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const snapshot = () =>
    buildRoomSnapshot({
      publicDoc: docs.publicDoc,
      adminDoc: hasAdminAccess ? docs.adminDoc : null,
      room: {
        code: roomCode,
        name: roomMeta?.roomName ?? roomName ?? null,
        templateId: templateId ?? roomMeta?.templateId ?? null,
        templateKind: templateKind ?? roomMeta?.templateKind ?? null,
      },
    });

  const flash = (kind: "json" | "csv") => {
    setDone(kind);
    setTimeout(() => setDone(null), 1800);
  };

  const exportJson = () => {
    downloadTextFile(
      `${baseName}-${stamp}.json`,
      JSON.stringify(snapshot(), null, 2),
      "application/json",
    );
    flash("json");
  };

  const exportCsv = () => {
    const csv = snapshotToCsv(snapshot().template);
    downloadTextFile(`${baseName}-${stamp}.csv`, csv || "No records to export\r\n", "text/csv");
    flash("csv");
  };

  return (
    <>
      <div className="section-title">Export data</div>
      <div className="card stack-sm">
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Download everything in this room. JSON is a complete backup; CSV opens in
          Excel or Google Sheets.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-sm" onClick={exportJson}>
            {done === "json" ? "Downloaded ✓" : "Export JSON"}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={exportCsv}>
            {done === "csv" ? "Downloaded ✓" : "Export CSV"}
          </button>
        </div>
      </div>
    </>
  );
}
