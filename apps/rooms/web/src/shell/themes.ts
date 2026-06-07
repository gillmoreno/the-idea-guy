export type ThemeId = "classic" | "paper" | "signal" | "glow";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
}

export const THEMES: ThemeDef[] = [
  { id: "classic", name: "Classic", tagline: "Clean & minimal (current)" },
  { id: "paper", name: "Paper", tagline: "Warm neutrals, flat surfaces" },
  { id: "signal", name: "Signal", tagline: "Grid, contrast, control-panel" },
  { id: "glow", name: "Glow", tagline: "Glass depth & accent shine" },
];

export const THEME_STORAGE_KEY = "rooms.theme.v1";

/** Legacy theme ids mapped to their replacement. */
const THEME_ALIASES: Record<string, ThemeId> = {
  aurora: "paper",
};

export function loadTheme(): ThemeId {
  if (typeof window === "undefined") return "classic";
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (!raw) return "classic";
  if (raw in THEME_ALIASES) {
    const migrated = THEME_ALIASES[raw];
    localStorage.setItem(THEME_STORAGE_KEY, migrated);
    return migrated;
  }
  return THEMES.some((t) => t.id === raw) ? (raw as ThemeId) : "classic";
}

export function saveTheme(id: ThemeId) {
  localStorage.setItem(THEME_STORAGE_KEY, id);
  document.documentElement.dataset.theme = id;
}
