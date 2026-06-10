import { useState } from "react";
import { THEMES, applyTheme, currentTheme, type ThemeId } from "../theme";

export default function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>(currentTheme());

  const pick = (id: ThemeId) => {
    applyTheme(id);
    setActive(id);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" aria-hidden>🎨</span>
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => pick(t.id)}
          title={t.label}
          aria-label={`Tema ${t.label}`}
          className="h-6 w-6 rounded-full border-2 transition active:scale-90"
          style={{
            background: t.swatch,
            borderColor: active === t.id ? "var(--fg)" : "var(--line)",
            transform: active === t.id ? "scale(1.15)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
