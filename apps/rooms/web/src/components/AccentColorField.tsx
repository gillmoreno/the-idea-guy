"use client";

import { useId, useMemo, useState } from "react";
import {
  ACCENT_GRADIENTS,
  ACCENT_SOLIDS,
  DEFAULT_ACCENT,
  accentCssEqual,
  accentToCss,
  gradientPresetCss,
  parseAccentCss,
  type AccentValue,
} from "@/lib/accentValue";

type AccentMode = "solid" | "gradient";

export function AccentColorField({
  value,
  onChange,
  label = "Accent",
}: {
  /** CSS background value — `#hex` or `linear-gradient(...)`. */
  value: string;
  onChange: (css: string) => void;
  label?: string;
}) {
  const parsed = useMemo(() => parseAccentCss(value || DEFAULT_ACCENT), [value]);
  const [mode, setMode] = useState<AccentMode>(parsed.kind === "gradient" ? "gradient" : "solid");
  const customId = useId();

  const previewCss = accentToCss(parsed);

  const setAccent = (next: AccentValue) => {
    onChange(accentToCss(next));
  };

  const solidSelected = (hex: string) =>
    parsed.kind === "solid" && accentCssEqual(parsed.color, hex);

  const gradientSelected = (css: string) => accentCssEqual(previewCss, css);

  const customSolid =
    parsed.kind === "solid" && !ACCENT_SOLIDS.some((c) => accentCssEqual(c, parsed.color))
      ? parsed.color
      : DEFAULT_ACCENT;

  return (
    <div className="accent-color-field">
      <div
        className="accent-color-field__preview"
        style={{ background: previewCss }}
        role="img"
        aria-label={`${label} preview`}
      />

      <div className="accent-color-field__modes" role="tablist" aria-label={`${label} type`}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "solid"}
          className={`accent-color-field__mode${mode === "solid" ? " active" : ""}`}
          onClick={() => setMode("solid")}
        >
          Solid
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "gradient"}
          className={`accent-color-field__mode${mode === "gradient" ? " active" : ""}`}
          onClick={() => setMode("gradient")}
        >
          Gradient
        </button>
      </div>

      {mode === "solid" ? (
        <>
          <div className="accent-color-field__grid" role="listbox" aria-label="Solid colors">
            {ACCENT_SOLIDS.map((hex) => (
              <button
                key={hex}
                type="button"
                role="option"
                aria-selected={solidSelected(hex)}
                aria-label={`Color ${hex}`}
                className={`accent-color-field__swatch${solidSelected(hex) ? " selected" : ""}`}
                style={{ background: hex }}
                onClick={() => setAccent({ kind: "solid", color: hex })}
              />
            ))}
          </div>
          <div className="accent-color-field__custom row gap-sm">
            <label htmlFor={customId} className="muted" style={{ fontSize: 13 }}>
              Custom
            </label>
            <input
              id={customId}
              type="color"
              className="accent-color-field__picker"
              value={customSolid}
              onChange={(e) => setAccent({ kind: "solid", color: e.target.value })}
            />
          </div>
        </>
      ) : (
        <div className="accent-color-field__grid accent-color-field__grid--gradient" role="listbox" aria-label="Gradient presets">
          {ACCENT_GRADIENTS.map((preset) => {
            const css = gradientPresetCss(preset);
            return (
              <button
                key={preset.id}
                type="button"
                role="option"
                aria-selected={gradientSelected(css)}
                aria-label={`Gradient ${preset.id}`}
                className={`accent-color-field__gradient${gradientSelected(css) ? " selected" : ""}`}
                style={{ background: css }}
                onClick={() =>
                  setAccent({
                    kind: "gradient",
                    from: preset.from,
                    to: preset.to,
                    angle: preset.angle,
                  })
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
