"use client";

import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket = null;

/**
 * Singleton Socket.io client (JWT in handshake).
 * Call after accessToken is in localStorage.
 */
export function getSocket() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  if (!socket) {
    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect_error", (err) => {
      const m = String(err?.message || "");
      if (m.includes("Authentication required") || m.includes("Invalid or expired")) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** After login / token refresh, force a new handshake with the latest token. */
export function reconnectSocket() {
  disconnectSocket();
  return getSocket();
}
