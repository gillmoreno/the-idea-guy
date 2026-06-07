"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, HardDrive, ImageIcon, Scissors } from "lucide-react";
import { useSecondBrain } from "@/lib/SecondBrainContext";
import { NoteStore } from "@/lib/store";
import {
  computeVaultStorage,
  formatBytes,
  getOriginStorageEstimate,
  type OriginStorageEstimate,
} from "@/lib/storageStats";

interface StoragePanelProps {
  store: NoteStore;
  version: number;
}

export function StoragePanel({ store, version }: StoragePanelProps) {
  const { compactVault } = useSecondBrain();
  const [origin, setOrigin] = useState<OriginStorageEstimate | null>(null);
  const [compacting, setCompacting] = useState(false);
  const [compactMsg, setCompactMsg] = useState<string | null>(null);

  const stats = useMemo(() => computeVaultStorage(store), [store, version]);

  useEffect(() => {
    void getOriginStorageEstimate().then(setOrigin);
  }, [version]);

  const maxNoteBytes = stats.notes[0]?.bytes ?? 1;
  const showCompactHint = stats.crdtBytes > stats.contentBytes * 1.15;

  const runCompact = async () => {
    setCompacting(true);
    setCompactMsg(null);
    try {
      const result = await compactVault();
      if (!result) {
        setCompactMsg("Could not compact right now.");
        return;
      }
      if (result.before <= result.after) {
        setCompactMsg("Already compact — sync data matches current content.");
        return;
      }
      setCompactMsg(
        `Reclaimed ${formatBytes(result.before - result.after)} (${formatBytes(result.before)} → ${formatBytes(result.after)})`,
      );
    } catch {
      setCompactMsg("Compaction failed. Try again while synced.");
    } finally {
      setCompacting(false);
    }
  };

  return (
    <div className="storage-panel stack-sm">
      <div className="storage-summary">
        <div className="storage-stat">
          <span className="storage-stat-label">
            <HardDrive size={12} />
            Vault content
          </span>
          <span className="storage-stat-value">{formatBytes(stats.contentBytes)}</span>
          <span className="storage-stat-hint">{stats.noteCount} note{stats.noteCount === 1 ? "" : "s"}</span>
        </div>
        {stats.imageBytes > 0 && (
          <div className="storage-stat">
            <span className="storage-stat-label">
              <ImageIcon size={12} />
              Images in vault
            </span>
            <span className="storage-stat-value">{formatBytes(stats.imageBytes)}</span>
            <span className="storage-stat-hint">Inline in note HTML</span>
          </div>
        )}
        <div className="storage-stat">
          <span className="storage-stat-label">
            <Database size={12} />
            On-device sync data
          </span>
          <span className="storage-stat-value">{formatBytes(stats.crdtBytes)}</span>
          <span className="storage-stat-hint">CRDT + IndexedDB history</span>
        </div>
        {origin && (
          <div className="storage-stat storage-stat-wide">
            <span className="storage-stat-label">This site (browser)</span>
            <span className="storage-stat-value">{formatBytes(origin.used)}</span>
            <span className="storage-stat-hint">
              {origin.quota > 0
                ? `${Math.round((origin.used / origin.quota) * 100)}% of ${formatBytes(origin.quota)} quota`
                : "Total for this origin"}
            </span>
          </div>
        )}
      </div>

      <div className="storage-compact-row">
        <button className="btn btn-sm" onClick={runCompact} disabled={compacting}>
          <Scissors size={14} />
          {compacting ? "Compacting…" : "Compact sync data"}
        </button>
        {showCompactHint && !compactMsg && (
          <span className="muted" style={{ fontSize: 11 }}>
            Sync data is larger than content — compaction can prune removed image history.
          </span>
        )}
        {compactMsg && (
          <span className="muted" style={{ fontSize: 11 }}>
            {compactMsg}
          </span>
        )}
      </div>

      {stats.notes.length > 0 && (
        <div className="storage-notes">
          <div className="panel-title">Notes by size</div>
          <div className="storage-note-list">
            {stats.notes.map((n) => (
              <div key={n.id} className="storage-note-row">
                <div className="storage-note-head">
                  <span className="storage-note-title">{n.title}</span>
                  <span className="storage-note-size">
                    {formatBytes(n.bytes)}
                    {n.imageBytes > 0 && (
                      <span className="storage-note-images"> · {formatBytes(n.imageBytes)} img</span>
                    )}
                  </span>
                </div>
                <div className="storage-bar-track">
                  <div
                    className="storage-bar-fill"
                    style={{ width: `${Math.max(4, (n.bytes / maxNoteBytes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="muted storage-footnote">
        Vault content is what your notes contain today. Sync data can stay larger after
        edits (especially removed images) until compaction prunes CRDT history. Large image
        removals auto-compact; use the button above anytime.
      </p>
    </div>
  );
}
