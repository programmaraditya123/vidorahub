import type { ApiResponse } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_VIDORAVIBE_API_URL ?? process.env.NEXT_PUBLIC_PYTHON_URL ?? "http://localhost:8000";

export class VidoraVibeApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
      signal: controller.signal,
    });
    const body = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !body.success) {
      throw new VidoraVibeApiError(
        body.error?.code ?? "REQUEST_FAILED",
        body.error?.message ?? "VidoraVibe could not complete the request.",
        body.error?.details,
      );
    }
    return body.data as T;
  } catch (error) {
    if (error instanceof VidoraVibeApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new VidoraVibeApiError("REQUEST_TIMEOUT", "The request timed out. Try again in a moment.");
    }
    throw new VidoraVibeApiError("NETWORK_ERROR", "VidoraVibe API is unreachable. Check that the backend is running.");
  } finally {
    window.clearTimeout(timeout);
  }
}
