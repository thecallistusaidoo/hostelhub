// lib/usePersistedState.js
// Drop-in replacement for useState that persists to localStorage.
// Data survives page refresh. Works like useState exactly.
//
// Usage:
//   const [rooms, setRooms] = usePersistedState("host_rooms", INITIAL_ROOMS);
//
// On first load: reads from localStorage. If nothing there, uses initialValue.
// On every setState: writes new value to localStorage automatically.

"use client";
import { useState, useEffect, useCallback } from "react";

export function usePersistedState(key, initialValue) {
  // Initialize from localStorage if available, else use initialValue
  const [state, setStateRaw] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Wrapped setter: updates state AND writes to localStorage
  const setState = useCallback((valueOrUpdater) => {
    setStateRaw(prev => {
      const next = typeof valueOrUpdater === "function"
        ? valueOrUpdater(prev)
        : valueOrUpdater;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn("localStorage write failed:", e);
      }
      return next;
    });
  }, [key]);

  // Sync when another tab changes the same key
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        try { setStateRaw(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [state, setState];
}

// Helper to clear a specific key (useful for "reset to defaults" buttons)
export function clearPersistedState(key) {
  if (typeof window !== "undefined") localStorage.removeItem(key);
}