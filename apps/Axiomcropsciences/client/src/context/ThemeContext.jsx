import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

const ThemeContext = createContext();

// Separate storage key from the admin panel ("axiomcropsciences-admin-theme")
const STORAGE_KEY = "axiomcropsciences-site-theme";

export function ThemeProvider({ children }) {
  // Default to light for the site (admin defaults to dark independently)
  const [theme, setTheme] = useState(
    () => {
      try { return localStorage.getItem(STORAGE_KEY) || "light"; } catch { return "light"; }
    }
  );

  useEffect(() => {
    const root = document.documentElement;
    // ONLY touch data-site-theme — never data-theme (that's admin-only)
    root.setAttribute("data-site-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  /**
   * Toggle dark ↔ light and persist the choice to MongoDB settings.
   * The API call is fire-and-forget — the UI never waits for it.
   */
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";

      // Persist to MongoDB (settings collection › siteTheme field)
      API.put("/settings", { siteTheme: next }).catch(() => {
        // Silently ignore network errors — theme still works locally
      });

      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
