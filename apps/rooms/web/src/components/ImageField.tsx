"use client";

import { useId, useRef, useState } from "react";
import {
  imageValueSrc,
  isImageFieldEmpty,
  parseHttpImageUrl,
  parseImageValue,
  serializeImageValue,
} from "@/lib/imageValue";
import { processImageUpload } from "@/lib/processImage";

type Mode = "upload" | "url";

export function ImageField({
  value,
  onChange,
  label = "Image",
  onInlineUploaded,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Called after a compressed inline image is stored — use to trigger room compaction. */
  onInlineUploaded?: () => void | Promise<void>;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseImageValue(value);
  const previewSrc = imageValueSrc(parsed);

  const clear = () => {
    onChange("");
    setUrlDraft("");
    setError(null);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await processImageUpload(file);
      onChange(serializeImageValue({ kind: "inline", mime: "image/webp", data }));
      await onInlineUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyUrl = () => {
    const href = parseHttpImageUrl(urlDraft);
    if (!href) {
      setError("Enter a public http or https image link");
      return;
    }
    onChange(serializeImageValue({ kind: "url", url: href }));
    setError(null);
  };

  return (
    <div className="image-field">
      <div className="image-field__modes" role="tablist" aria-label={`${label} source`}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "upload"}
          className={`image-field__mode${mode === "upload" ? " active" : ""}`}
          onClick={() => setMode("upload")}
        >
          Upload
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "url"}
          className={`image-field__mode${mode === "url" ? " active" : ""}`}
          onClick={() => setMode("url")}
        >
          Link
        </button>
      </div>

      {previewSrc ? (
        <div className="image-field__preview-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="image-field__preview" src={previewSrc} alt="" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            Remove
          </button>
        </div>
      ) : mode === "upload" ? (
        <div className="image-field__upload">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor={inputId} className={`image-field__drop${busy ? " busy" : ""}`}>
            {busy ? "Compressing…" : "Choose photo — auto-crop & WebP (max 300 KB)"}
          </label>
        </div>
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

      {parsed?.kind === "inline" && (
        <p className="image-field__hint muted">Stored compressed in your encrypted room sync.</p>
      )}
      {parsed?.kind === "url" && (
        <p className="image-field__hint muted">Linked image — not stored in sync.</p>
      )}
      {error && <p className="image-field__error">{error}</p>}
      {!isImageFieldEmpty(value) && !previewSrc && (
        <p className="image-field__error">Image could not be loaded.</p>
      )}
    </div>
  );
}
