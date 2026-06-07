export type ThemeId = "classic" | "aurora" | "signal" | "glow";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
}

export const THEMES: ThemeDef[] = [
  { id: "classic", name: "Classic", tagline: "Clean & minimal (current)" },
  { id: "aurora", name: "Aurora", tagline: "Soft gradients & emoji glow" },
  { id: "signal", name: "Signal", tagline: "Grid, contrast, control-panel" },
  { id: "glow", name: "Glow", tagline: "Glass depth & accent shine" },
];

export const THEME_STORAGE_KEY = "rooms.theme.v1";

export function loadTheme(): ThemeId {
  if (typeof window === "undefined") return "classic";
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.some((t) => t.id === raw) ? (raw as ThemeId) : "classic";
}

export function saveTheme(id: ThemeId) {
  localStorage.setItem(THEME_STORAGE_KEY, id);
  document.documentElement.dataset.theme = id;
}
