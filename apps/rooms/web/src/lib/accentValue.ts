/** Accent brick — solid hex or linear gradient stored as a CSS `background` value. */

export type AccentValue =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; from: string; to: string; angle?: number };

export const DEFAULT_ACCENT = "#4f46e5";

/** Curated solids — enough variety without a full color wheel. */
export const ACCENT_SOLIDS = [
  "#4f46e5",
  "#6366f1",
  "#818cf8",
  "#2563eb",
  "#3b82f6",
  "#0ea5e9",
  "#06b6d4",
  "#14b8a6",
  "#10b981",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#f43f5e",
  "#ec4899",
  "#d946ef",
  "#a855f7",
  "#8b5cf6",
  "#7c3aed",
  "#64748b",
  "#78716c",
  "#57534e",
  "#0f172a",
  "#1d4ed8",
  "#0369a1",
  "#047857",
  "#4d7c0f",
  "#b45309",
  "#b91c1c",
  "#9d174d",
  "#5b21b6",
  "#312e81",
  "#155e75",
  "#14532d",
  "#365314",
  "#78350f",
  "#7f1d1d",
  "#831843",
] as const;

export type AccentGradientPreset = {
  id: string;
  from: string;
  to: string;
  angle?: number;
};

/** Hand-picked gradient pairs — one tap, no sliders. */
export const ACCENT_GRADIENTS: AccentGradientPreset[] = [
  { id: "indigo-rose", from: "#4f46e5", to: "#ec4899", angle: 135 },
  { id: "sky-cyan", from: "#0ea5e9", to: "#06b6d4", angle: 135 },
  { id: "violet-fuchsia", from: "#7c3aed", to: "#d946ef", angle: 135 },
  { id: "amber-orange", from: "#f59e0b", to: "#f97316", angle: 135 },
  { id: "emerald-teal", from: "#10b981", to: "#14b8a6", angle: 135 },
  { id: "rose-red", from: "#f43f5e", to: "#ef4444", angle: 135 },
  { id: "blue-indigo", from: "#3b82f6", to: "#4f46e5", angle: 135 },
  { id: "lime-green", from: "#84cc16", to: "#22c55e", angle: 135 },
  { id: "purple-pink", from: "#8b5cf6", to: "#ec4899", angle: 120 },
  { id: "cyan-blue", from: "#06b6d4", to: "#2563eb", angle: 120 },
  { id: "sunset", from: "#f97316", to: "#ec4899", angle: 145 },
  { id: "ocean", from: "#0ea5e9", to: "#6366f1", angle: 160 },
  { id: "forest", from: "#22c55e", to: "#0ea5e9", angle: 140 },
  { id: "berry", from: "#a855f7", to: "#f43f5e", angle: 135 },
  { id: "slate", from: "#64748b", to: "#0f172a", angle: 135 },
  { id: "gold", from: "#eab308", to: "#f59e0b", angle: 90 },
];

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const GRADIENT_RE =
  /^linear-gradient\(\s*([-\d.]+)deg\s*,\s*(#[0-9a-f]{3,6})\s+0%\s*,\s*(#[0-9a-f]{3,6})\s+100%\s*\)$/i;

export function normalizeHex(hex: string): string | null {
  const t = hex.trim();
  if (!HEX_RE.test(t)) return null;
  if (t.length === 4) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return t.toLowerCase();
}

export function accentToCss(value: AccentValue): string {
  if (value.kind === "solid") {
    return normalizeHex(value.color) ?? DEFAULT_ACCENT;
  }
  const from = normalizeHex(value.from) ?? DEFAULT_ACCENT;
  const to = normalizeHex(value.to) ?? "#ec4899";
  const angle = value.angle ?? 135;
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}

export function parseAccentCss(css: string): AccentValue {
  const raw = css.trim();
  const grad = GRADIENT_RE.exec(raw);
  if (grad) {
    return {
      kind: "gradient",
      from: normalizeHex(grad[2]) ?? grad[2],
      to: normalizeHex(grad[3]) ?? grad[3],
      angle: Number(grad[1]),
    };
  }
  const hex = normalizeHex(raw);
  if (hex) return { kind: "solid", color: hex };
  return { kind: "solid", color: DEFAULT_ACCENT };
}

export function accentCssEqual(a: string, b: string): boolean {
  return accentToCss(parseAccentCss(a)) === accentToCss(parseAccentCss(b));
}

export function gradientPresetCss(preset: AccentGradientPreset): string {
  return accentToCss({
    kind: "gradient",
    from: preset.from,
    to: preset.to,
    angle: preset.angle,
  });
}
