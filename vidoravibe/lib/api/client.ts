import type { ApiResponse } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_VIDORAVIBE_API_URL ?? "http://localhost:8001";
export class VidoraVibeApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message); }
}
export async function apiRequest<T>(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    const token = window.localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal, cache: "no-store" });
    const body = await response.json() as ApiResponse<T>;
    if (!response.ok || !body.success) {
      if (response.status === 401) window.dispatchEvent(new Event("vidoravibe:unauthorized"));
      throw new VidoraVibeApiError(body.error?.code ?? "REQUEST_FAILED", body.error?.message ?? "Request failed.");
    }
    return body.data as T;
  } catch (error) {
    if (error instanceof VidoraVibeApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new VidoraVibeApiError("REQUEST_TIMEOUT", "Request timed out. Please retry.");
    throw new VidoraVibeApiError("NETWORK_ERROR", "Could not reach VidoraVibe. Please check your connection.");
  } finally { window.clearTimeout(timeout); }
}
