import { create } from "zustand";

import type { User } from "@/lib/api";

type AuthMode = "none" | "demo" | "auth0";

interface AuthState {
  mode: AuthMode;
  user: User | null;
  token: string | null;
  hydrated: boolean;
  authLoading: boolean;
  setDemoAuth: (user: User, token: string) => void;
  setAuth0Session: (user: User, token: string) => void;
  setAuthLoading: (value: boolean) => void;
  hydrate: () => void;
  clearAuth: () => void;
}

const TOKEN_KEY = "penny_token";
const USER_KEY = "penny_user";
const MODE_KEY = "penny_mode";

function persistAuth(mode: AuthMode, user: User | null, token: string | null) {
  if (typeof window === "undefined") return;
  if (!user || !token || mode === "none") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(MODE_KEY, mode);
}

export const useAuth = create<AuthState>((set) => ({
  mode: "none",
  user: null,
  token: null,
  hydrated: false,
  authLoading: false,
  setDemoAuth: (user, token) => {
    persistAuth("demo", user, token);
    set({ mode: "demo", user, token, hydrated: true });
  },
  setAuth0Session: (user, token) => {
    persistAuth("auth0", user, token);
    set({ mode: "auth0", user, token, hydrated: true });
  },
  setAuthLoading: (authLoading) => set({ authLoading }),
  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    const mode = (localStorage.getItem(MODE_KEY) as AuthMode | null) || "none";

    if (token && raw) {
      try {
        set({ token, user: JSON.parse(raw), mode, hydrated: true });
        return;
      } catch {
        persistAuth("none", null, null);
      }
    }
    set({ mode: "none", user: null, token: null, hydrated: true });
  },
  clearAuth: () => {
    persistAuth("none", null, null);
    set({ mode: "none", user: null, token: null, hydrated: true });
  },
}));
