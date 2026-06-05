"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, type AuthResponse, type AuthUser } from "@/lib/api";

type RegisterInput = {
  organizationName: string;
  organizationSlug: string;
  name: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((response: { data: AuthResponse }) => {
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);

    return response.data.accessToken;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      return applyAuth(await apiRequest<{ data: AuthResponse }>("/auth/refresh", { method: "POST" }));
    } catch {
      setAccessToken(null);
      setUser(null);

      return null;
    }
  }, [applyAuth]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshSession().finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshSession]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      applyAuth(
        await apiRequest<{ data: AuthResponse }>("/auth/login", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      );
    },
    [applyAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      applyAuth(
        await apiRequest<{ data: AuthResponse }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      );
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    await apiRequest<{ data: { success: boolean } }>("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ accessToken, user, loading, login, register, logout, refreshSession }),
    [accessToken, user, loading, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
