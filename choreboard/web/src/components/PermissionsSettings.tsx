"use client";

import { useState } from "react";
import { useChoreBoard } from "@/lib/ChoreBoardContext";
import {
  DEFAULT_KID_PERMISSIONS,
  getEffectivePermissions,
  PERMISSION_LABELS,
} from "@/lib/permissions";
import { KidPermissions } from "@/lib/types";

const KEYS = Object.keys(DEFAULT_KID_PERMISSIONS) as (keyof KidPermissions)[];

export function PermissionsSettings() {
  const { store } = useChoreBoard();
  const [selectedKid, setSelectedKid] = useState<string | "defaults">("defaults");
  if (!store?.canAdmin) return null;

  const kids = store.listMembers().filter((m) => m.role === "kid");
  const isOverride = selectedKid !== "defaults";
  const editing =
    selectedKid === "defaults"
      ? store.getKidDefaults()
      : getEffectivePermissions(store, selectedKid);

  const toggle = (key: keyof KidPermissions) => {
    const current =
      selectedKid === "defaults"
        ? store.getKidDefaults()
        : getEffectivePermissions(store, selectedKid);
    const next = !current[key];
    if (selectedKid === "defaults") {
      store.setKidDefaults({ ...current, [key]: next });
    } else {
      store.setKidOverride(selectedKid, { [key]: next });
    }
  };

  return (
    <div className="stack">
      <div className="section-title">Kid permissions</div>
      <p className="muted" style={{ fontSize: 13, padding: "0 2px" }}>
        Defaults apply to all kids. Override one child for special rules. Syncs to their
        devices automatically. (Hiding a balance only affects the app UI — see docs.)
      </p>

      <div className="tabs">
        <button
          className={selectedKid === "defaults" ? "active" : ""}
          onClick={() => setSelectedKid("defaults")}
        >
          All kids (default)
        </button>
        {kids.map((k) => (
          <button
            key={k.id}
            className={selectedKid === k.id ? "active" : ""}
            onClick={() => setSelectedKid(k.id)}
          >
            {k.name}
          </button>
        ))}
      </div>

      <div className="card stack-sm">
        {KEYS.map((key) => (
          <label key={key} className="card-row" style={{ padding: "6px 2px" }}>
            <span style={{ fontSize: 14, flex: 1, paddingRight: 12 }}>{PERMISSION_LABELS[key]}</span>
            <input
              type="checkbox"
              checked={editing[key]}
              onChange={() => toggle(key)}
            />
          </label>
        ))}
        {isOverride && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              store.clearKidOverride(selectedKid);
              setSelectedKid("defaults");
            }}
          >
            Reset {store.getMember(selectedKid)?.name} to defaults
          </button>
        )}
      </div>
    </div>
  );
}
