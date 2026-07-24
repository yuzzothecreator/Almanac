"use client";

import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";

export function useAuthedFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async (input: string, init: RequestInit = {}) => {
      const token = await getToken();
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(input, { ...init, headers });
    },
    [getToken]
  );
}
