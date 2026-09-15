import axios from "axios";

/** Public FastAPI catalog client. No account token is needed for these reads. */
export const http3 = axios.create({
  baseURL: process.env.
NEXT_PUBLIC_FASTAPI_URL ||
    "https://vidorahub.fastapicloud.dev",
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

http3.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const detail: unknown = error.response?.data?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg?: string }) => item.msg || "Invalid filter").join("; ")
        : error.response?.data?.message || error.message || "Unable to load products";
    return Promise.reject({ status: error.response?.status, message, raw: error });
  },
);
