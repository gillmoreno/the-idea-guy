"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, HardDrive, ImageIcon } from "lucide-react";
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
  const [origin, setOrigin] = useState<OriginStorageEstimate | null>(null);

  const stats = useMemo(() => computeVaultStorage(store), [store, version]);

  useEffect(() => {
    void getOriginStorageEstimate().then(setOrigin);
  }, [version]);

  const maxNoteBytes = stats.notes[0]?.bytes ?? 1;

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
          <span className="storage-stat-hint">CRDT + IndexedDB</span>
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
        Content size is your note text and metadata. Sync data includes CRDT history kept for
        offline editing and multi-device merge.
      </p>
    </div>
  );
}
