"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiError, apiRequest } from "@/lib/api";

export function useAuthenticatedRequest() {
  const { accessToken, loading, refreshSession } = useAuth();

  const requestWithAuth = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      const token = accessToken ?? (await refreshSession());

      if (!token) throw new ApiError(401, "Please sign in to continue", "AUTH_REQUIRED");

      return apiRequest<T>(path, { ...options, accessToken: token });
    },
    [accessToken, refreshSession],
  );

  return { accessToken, authLoading: loading, requestWithAuth };
}
