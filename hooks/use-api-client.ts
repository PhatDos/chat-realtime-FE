import { useAuth } from "@clerk/nextjs";
import apiClient from "../lib/api-client";
import { useCallback, useMemo } from "react";

export const useApiClient = () => {
  const { getToken } = useAuth();

  const authenticatedRequest = useCallback(
    async <T = any>(
      method: "get" | "post" | "patch" | "put" | "delete",
      url: string,
      data?: any,
      config?: any
    ): Promise<T> => {
      const token = await getToken();

      const res = await apiClient.request<T>({
        method,
        url,
        data,
        ...config,
        headers: {
          ...config?.headers,
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return res.data;
    },
    [getToken]
  );

  return useMemo(
    () => ({
      get: <T = any>(url: string, config?: any) =>
        authenticatedRequest<T>("get", url, undefined, config),
      post: <T = any>(url: string, data?: any, config?: any) =>
        authenticatedRequest<T>("post", url, data, config),
      patch: <T = any>(url: string, data?: any, config?: any) =>
        authenticatedRequest<T>("patch", url, data, config),
      put: <T = any>(url: string, data?: any, config?: any) =>
        authenticatedRequest<T>("put", url, data, config),
      delete: <T = any>(url: string, config?: any) =>
        authenticatedRequest<T>("delete", url, undefined, config),
    }),
    [authenticatedRequest]
  );
};
