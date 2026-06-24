/**
 * Admin-only theme store — completely independent from the site ThemeContext.
 *
 * Strategy: apply [data-theme] on the .admin-layout wrapper element so the
 * admin CSS variables are scoped to that subtree only.  The site's
 * [data-site-theme] on <html> is never touched here.
 *
 * Storage key: "axiomcropsciences-admin-theme"  (site uses "axiomcropsciences-site-theme")
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "axiomcropsciences-admin-theme";
const ADMIN_SELECTOR = ".admin-layout";

/** Read persisted value (default: dark) */
function getStored() {
  try { return localStorage.getItem(STORAGE_KEY) || "dark"; } catch { return "dark"; }
}

/** Apply [data-theme] to the admin wrapper div (not to <html>) */
function applyToAdmin(theme) {
  const el = document.querySelector(ADMIN_SELECTOR);
  if (el) {
    el.setAttribute("data-theme", theme);
  }
}

/**
 * useAdminTheme — drop-in replacement for useTheme() in admin components.
 * Returns { theme, toggleTheme }
 */
export function useAdminTheme() {
  const [theme, setTheme] = useState(getStored);

  // On mount: apply the persisted theme to the admin wrapper immediately.
  // We use a MutationObserver trick to handle the case where the wrapper
  // doesn't exist yet when this hook first runs (it mounts inside AdminLayout).
  useEffect(() => {
    applyToAdmin(theme);

    // If the element wasn't in the DOM yet, watch for it to appear.
    if (!document.querySelector(ADMIN_SELECTOR)) {
      const obs = new MutationObserver(() => {
        if (document.querySelector(ADMIN_SELECTOR)) {
          applyToAdmin(theme);
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      return () => obs.disconnect();
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      applyToAdmin(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
