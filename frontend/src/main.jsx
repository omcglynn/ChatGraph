import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

// Theme: only "light" or "dark"
const THEME_KEY = "cg-theme"; // "light" | "dark"

function applyTheme(theme) {
  const prev = document.documentElement.getAttribute("data-theme");
  console.log("[theme] applyTheme() called. prev data-theme:", prev, " -> applying:", theme);
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    // treat anything else as light
    document.documentElement.setAttribute("data-theme", "light");
  }
  console.log("[theme] resulting data-theme:", document.documentElement.getAttribute("data-theme"));
}

// detect preferred scheme (returns "dark" or "light")
function detectPreferred() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

// read saved preference (if missing, fall back to OS preference)
let saved = localStorage.getItem(THEME_KEY);
if (saved !== "light" && saved !== "dark") {
  saved = detectPreferred();
  console.log("[theme] no saved preference, using OS preference:", saved);
} else {
  console.log("[theme] saved preference on load:", saved);
}
applyTheme(saved);

// watch system changes and, if the user hasn't explicitly picked a theme, respond by applying the new system preference
// NOTE: when we removed "system" mode we still want the page to follow system on first load (above), but after user picks a theme we won't override it.
// So we only apply system changes if localStorage has no explicit value (or an invalid value).
const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
function onSystemChange(ev) {
  console.log("[theme] system preference changed:", ev.matches ? "dark" : "light");
  const cur = localStorage.getItem(THEME_KEY);
  if (cur !== "light" && cur !== "dark") {
    // no explicit user preference; adopt new system preference
    const newPref = ev.matches ? "dark" : "light";
    applyTheme(newPref);
    window.dispatchEvent(new CustomEvent("cg-theme-change", { detail: newPref }));
  }
}
if (mql) {
  if (mql.addEventListener) mql.addEventListener("change", onSystemChange);
  else if (mql.addListener) mql.addListener(onSystemChange);
}

// Helpers: setTheme and toggleTheme
window.setTheme = (theme) => {
  const t = theme === "dark" ? "dark" : "light";
  console.log("[theme] window.setTheme called with:", theme, " -> normalized:", t);
  localStorage.setItem(THEME_KEY, t);
  applyTheme(t);
  try {
    window.dispatchEvent(new CustomEvent("cg-theme-change", { detail: t }));
    console.log("[theme] dispatched cg-theme-change:", t);
  } catch (err) {
    console.warn("[theme] dispatch cg-theme-change failed", err);
  }
};

// toggle between light and dark
window.toggleTheme = () => {
  const cur = localStorage.getItem(THEME_KEY);
  const normalizedCur = cur === "dark" ? "dark" : "light";
  const next = normalizedCur === "dark" ? "light" : "dark";
  console.log("[theme] window.toggleTheme: cur:", normalizedCur, " -> next:", next);
  window.setTheme(next);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
