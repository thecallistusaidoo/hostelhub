// lib/useDarkMode.js
// A shared hook for the dark mode toggle.
// Import this in any component — Navbar, dashboard headers, auth pages — 
// so every page has a working theme button.

"use client";
import { useState, useEffect, useCallback } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    // Dispatch so other components on the same page can react
    window.dispatchEvent(new CustomEvent("themechange", { detail: { dark: next } }));
  }, [dark]);

  return { dark, toggle, mounted };
}

// DarkModeButton — drop anywhere, self-contained
export function DarkModeButton({ className = "" }) {
  const { dark, toggle, mounted } = useDarkMode();

  // Sync when another component toggles
  useEffect(() => {
    const handler = (e) => {
      // re-read from DOM
      const isDark = document.documentElement.classList.contains("dark");
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  if (!mounted) return <div className={`w-9 h-9 ${className}`}/>;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
        glass border border-white/30 dark:border-white/10
        hover:border-[#1E40AF]/40 dark:hover:border-blue-400/30
        hover:bg-white/40 dark:hover:bg-blue-900/20
        ${className}`}
    >
      {dark ? (
        // Sun icon
        <svg className="w-4 h-4 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
        </svg>
      ) : (
        // Moon icon
        <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
        </svg>
      )}
    </button>
  );
}