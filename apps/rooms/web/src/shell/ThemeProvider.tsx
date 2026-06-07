"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadTheme, saveTheme, ThemeId } from "./themes";

const Ctx = createContext<{
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("classic");

  useEffect(() => {
    const t = loadTheme();
    setThemeState(t);
    document.documentElement.dataset.theme = t;
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    saveTheme(id);
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
