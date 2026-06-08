import { accentToCss, DEFAULT_ACCENT, parseAccentCss } from "./accentValue";

/** Inline vars on `<html>` — override theme `--primary` for buttons, links, highlights. */
export function applyPersonaAccent(accentCss: string | undefined) {
  if (typeof document === "undefined") return;
  const parsed = parseAccentCss(accentCss?.trim() || DEFAULT_ACCENT);
  const primary = parsed.kind === "solid" ? parsed.color : parsed.from;
  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-dark", `color-mix(in srgb, ${primary} 78%, black)`);
  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${primary} 14%, var(--surface))`,
  );
  if (parsed.kind === "gradient") {
    root.style.setProperty("--primary-gradient", accentToCss(parsed));
  } else {
    root.style.removeProperty("--primary-gradient");
  }
}

export function clearPersonaAccent() {
  if (typeof document === "undefined") return;
  for (const key of ["--primary", "--primary-dark", "--primary-soft", "--primary-gradient"]) {
    document.documentElement.style.removeProperty(key);
  }
}
