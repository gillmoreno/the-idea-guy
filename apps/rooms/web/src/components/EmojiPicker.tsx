"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Theme } from "emoji-picker-react";
import { DEFAULT_RECORD_EMOJI } from "@/lib/emoji";

const EmojiPickerPanel = dynamic(
  () => import("./EmojiPickerPanel").then((m) => m.EmojiPickerPanel),
  {
    ssr: false,
    loading: () => <div className="emoji-picker__loading">Loading emojis…</div>,
  },
);

function roomsThemeToPickerTheme(): Theme {
  if (typeof document === "undefined") return Theme.LIGHT;
  const id = document.documentElement.dataset.theme;
  return id === "glow" ? Theme.DARK : Theme.LIGHT;
}

export type EmojiPickerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Shown in the trigger when `value` is empty */
  fallback?: string;
  className?: string;
};

export function EmojiPicker({
  value,
  onChange,
  fallback = DEFAULT_RECORD_EMOJI,
  className,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [pickerTheme, setPickerTheme] = useState(Theme.LIGHT);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const display = value.trim() || fallback;

  const syncTheme = useCallback(() => {
    setPickerTheme(roomsThemeToPickerTheme());
  }, []);

  useEffect(() => {
    syncTheme();
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, [syncTheme]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const pick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  const rootClass = ["emoji-picker", className].filter(Boolean).join(" ");

  return (
    <div ref={rootRef} className={rootClass}>
      <button
        type="button"
        className="emoji-picker__trigger"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="emoji-picker__preview" aria-hidden>
          {display}
        </span>
        <span className="emoji-picker__copy">
          <span className="emoji-picker__label">{open ? "Close picker" : "Choose emoji"}</span>
          <span className="emoji-picker__hint muted">Search · categories · skin tones</span>
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="emoji-picker__popover"
          role="dialog"
          aria-label="Emoji picker"
        >
          <EmojiPickerPanel theme={pickerTheme} onSelect={pick} />
        </div>
      )}
    </div>
  );
}
