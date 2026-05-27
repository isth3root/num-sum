import { useState, useEffect } from "react";
import { themes, defaultThemeId } from "../data/themes";
import { type ThemeId, type Theme } from "../types";

const STORAGE_KEY = "numgrid-theme";

function getSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && themes.some((t) => t.id === saved)) return saved as ThemeId;
  } catch {
    // localStorage unavailable
  }
  return defaultThemeId;
}

export const useTheme = () => {
  const [themeId, setThemeIdState] = useState<ThemeId>(getSavedTheme);

  const currentTheme: Theme = themes.find((t) => t.id === themeId) ?? themes[0];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme.css).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    root.setAttribute("data-theme", currentTheme.dark ? "dark" : "light");
  }, [currentTheme]);

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable
    }
  };

  return { themeId, setThemeId, currentTheme, themes };
};