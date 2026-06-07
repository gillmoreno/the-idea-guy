"use client";

import { THEMES } from "./themes";
import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="card stack-sm theme-switcher">
      <div className="section-title">Look &amp; feel</div>
      {!compact && (
        <p className="muted" style={{ fontSize: 13 }}>
          Four CSS-only themes — no images, snappy on mobile. Pick one to iterate on.
        </p>
      )}
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`theme-chip${theme === t.id ? " active" : ""}`}
            data-preview-theme={t.id}
            onClick={() => setTheme(t.id)}
          >
            <strong>{t.name}</strong>
            <span className="muted">{t.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
