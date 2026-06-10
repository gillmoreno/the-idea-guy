export const THEMES = [
  { id: "duo", label: "Duo", swatch: "#58cc02" },
  { id: "notion", label: "Notion", swatch: "#37352f" },
  { id: "notte", label: "Notte", swatch: "#d4a843" },
  { id: "carta", label: "Carta", swatch: "#c4552d" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const KEY = "inkanto_theme";

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(KEY, id);
  // keep the browser chrome (PWA status bar) matched to the page background
  requestAnimationFrame(() => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
  });
}

export function currentTheme(): ThemeId {
  const stored = localStorage.getItem(KEY);
  return (THEMES.some((t) => t.id === stored) ? stored : "duo") as ThemeId;
}

export function initTheme() {
  applyTheme(currentTheme());
}
