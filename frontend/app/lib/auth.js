"use client";
// lib/auth.js
// Auth context + useAuth hook + ProtectedRoute component
// Place this at: app/lib/auth.js

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "./api";

const AuthContext = createContext(null);

// ─── Provider: wrap your layout with this
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate from localStorage on mount
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const signup = async (role, formData) => {
    const fn = role === "student" ? authAPI.signupStudent : authAPI.signupHost;
    const { data } = await fn(formData);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    try {
      await authAPI.logout({ refreshToken, role: storedUser.role });
    } catch (_) {}
    localStorage.clear();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Protected route wrapper
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace("/");
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return children;
}