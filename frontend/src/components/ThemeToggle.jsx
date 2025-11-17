import React, { useEffect, useState } from "react";

const STORAGE_KEY = "cg-theme";

export default function ThemeToggle() {
  // initialize from localStorage; if missing fall back to OS
  const initial = (localStorage.getItem(STORAGE_KEY) === "dark") ? "dark" : (
    (localStorage.getItem(STORAGE_KEY) === "light") ? "light" : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  const [mode, setMode] = useState(initial);

  useEffect(() => {

    const updateFromStorage = () => {
      const s = localStorage.getItem(STORAGE_KEY);
      const normalized = s === "dark" ? "dark" : (s === "light" ? "light" : null);
      console.log("[ThemeToggle] updateFromStorage ->", s, "normalized:", normalized);
      if (normalized) setMode(normalized);
    };

    // storage event (other tabs)
    const onStorage = (e) => {
      if (!e || e.key === STORAGE_KEY) {
        console.log("[ThemeToggle] storage event:", e);
        updateFromStorage();
      }
    };
    window.addEventListener("storage", onStorage);

    // custom event dispatched by our main theme helper for same-tab updates
    const onThemeChange = (ev) => {
      const next = ev?.detail;
      console.log("[ThemeToggle] cg-theme-change event received, detail:", next);
      if (next === "dark" || next === "light") setMode(next);
    };
    window.addEventListener("cg-theme-change", onThemeChange);

    // sync once on mount
    updateFromStorage();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cg-theme-change", onThemeChange);
    };
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    console.log("[ThemeToggle] toggle: current:", mode, " -> next:", next);
    if (window.setTheme) {
      window.setTheme(next);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "light");
      window.dispatchEvent(new CustomEvent("cg-theme-change", { detail: next }));
    }
    setMode(next);
  };

  const icon = mode === "dark" ? "🌙" : "☀️";

  return (
    <button
      onClick={toggle}
      title={`Theme: ${mode} (click to toggle)`}
      className="cg-button secondary"
      style={{ marginLeft: 8 }}
    >
      {icon}
    </button>
  );
}