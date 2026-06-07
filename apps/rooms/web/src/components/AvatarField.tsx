"use client";

import { useId, useRef, useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import {
  parseAvatarValue,
  serializeAvatarValue,
  type AvatarValue,
} from "@/lib/avatarValue";
import { imageValueSrc, parseHttpImageUrl } from "@/lib/imageValue";
import { processAvatarUpload } from "@/lib/processImage";
import { AvatarPreview } from "./PersonaAvatar";

type PhotoMode = "upload" | "url";
type AvatarMode = "emoji" | "photo";

export function AvatarField({
  value,
  onChange,
  displayName,
  color,
  onInlineUploaded,
}: {
  /** Serialized `AvatarValue` JSON, or empty for initials fallback. */
  value: string;
  onChange: (value: string) => void;
  displayName: string;
  color: string;
  onInlineUploaded?: () => void | Promise<void>;
}) {
  const parsed = parseAvatarValue(value);
  const [mode, setMode] = useState<AvatarMode>(parsed?.kind === "image" ? "photo" : "emoji");
  const [photoMode, setPhotoMode] = useState<PhotoMode>("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileId = useId();

  const emojiValue = parsed?.kind === "emoji" ? parsed.emoji : "😊";

  const setAvatar = (next: AvatarValue | null) => {
    onChange(next ? serializeAvatarValue(next) : "");
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await processAvatarUpload(file);
      setAvatar({ kind: "image", image: { kind: "inline", mime: "image/webp", data } });
      await onInlineUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    const href = parseHttpImageUrl(urlDraft);
    if (!href) {
      setError("Enter a public http or https image link");
      return;
    }
    setAvatar({ kind: "image", image: { kind: "url", url: href } });
    setError(null);
  };

  const clearPhoto = () => {
    setAvatar({ kind: "emoji", emoji: emojiValue });
    setUrlDraft("");
    setError(null);
  };

  const previewSrc =
    parsed?.kind === "image" ? imageValueSrc(parsed.image) : null;

  return (
    <div className="avatar-field">
      <div className="avatar-field__preview-row">
        <AvatarPreview displayName={displayName || "You"} color={color} avatar={value} />
        <div className="avatar-field__hint muted">
          Square crop · circle in UI
          <br />
          Photo ≤ 80 KB WebP, or pick an emoji
        </div>
      </div>

      <div className="avatar-field__modes" role="tablist" aria-label="Avatar type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "emoji"}
          className={`avatar-field__mode${mode === "emoji" ? " active" : ""}`}
          onClick={() => setMode("emoji")}
        >
          Emoji
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "photo"}
          className={`avatar-field__mode${mode === "photo" ? " active" : ""}`}
          onClick={() => setMode("photo")}
        >
          Photo
        </button>
      </div>

      {mode === "emoji" ? (
        <EmojiPicker
          value={emojiValue}
          onChange={(emoji) => setAvatar({ kind: "emoji", emoji })}
          fallback="😊"
        />
      ) : (
        <div className="avatar-field__photo stack-sm">
          {previewSrc ? (
            <div className="avatar-field__photo-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt="" className="persona-avatar persona-avatar--md" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearPhoto}>
                Remove photo
              </button>
            </div>
          ) : (
            <>
              <div className="image-field__modes" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={photoMode === "upload"}
                  className={`image-field__mode${photoMode === "upload" ? " active" : ""}`}
                  onClick={() => setPhotoMode("upload")}
                >
                  Upload
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={photoMode === "url"}
                  className={`image-field__mode${photoMode === "url" ? " active" : ""}`}
                  onClick={() => setPhotoMode("url")}
                >
                  Link
                </button>
              </div>
              {photoMode === "upload" ? (
                <>
                  <input
                    id={fileId}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
                  />
                  <label
                    htmlFor={fileId}
                    className={`image-field__drop avatar-field__drop${busy ? " busy" : ""}`}
                  >
                    {busy
                      ? "Cropping & compressing…"
                      : "Choose photo — auto square crop"}
                  </label>
                </>
              ) : (
                <div className="image-field__url row gap-sm">
                  <input
                    className="input"
                    placeholder="https://…"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={applyUrl}>
                    Use link
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="image-field__error">{error}</p>}
    </div>
  );
}
