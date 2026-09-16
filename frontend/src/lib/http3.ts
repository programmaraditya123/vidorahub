import axios from "axios";

/** FastAPI client. Uses the current account token when one is available. */
export const http3 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL ||
    "https://vidorahub.fastapicloud.dev",
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

http3.interceptors.request.use((config) => {
  // Explicit headers also allow authenticated requests during server rendering.
  if (typeof window === "undefined" || config.headers.has("Authorization")) {
    return config;
  }

  try {
    // Read on every request so login, logout, and token changes take effect.
    const token = window.localStorage.getItem("token")?.trim();
    if (token && token !== "null" && token !== "undefined") {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // Browser privacy settings can make localStorage inaccessible.
    // Public requests can still proceed; protected endpoints will return 401.
  }

  return config;
});

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function errorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return nonEmptyString(value);
  if (!value || typeof value !== "object") return undefined;

  if (Array.isArray(value)) {
    return value.map(errorMessage).filter(Boolean).join("; ") || undefined;
  }

  const error = value as Record<string, unknown>;
  return nonEmptyString(error.msg) || nonEmptyString(error.message);
}

http3.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const data: unknown = error.response?.data;
    const body = data && typeof data === "object"
      ? data as Record<string, unknown>
      : undefined;
    const serverMessage = errorMessage(body?.detail) || errorMessage(body?.message);
    const transportMessage = !error.response
      ? error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
        ? "The request timed out. Please try again."
        : error.code === "ERR_NETWORK"
          ? "Unable to connect to the server. Check your connection and try again."
          : undefined
      : undefined;
    const message = serverMessage || transportMessage || nonEmptyString(error.message)
      || "Something went wrong. Please try again.";
    return Promise.reject({ status: error.response?.status, message, raw: error });
  },
);
