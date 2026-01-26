import axios from "axios";

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
  withCredentials: false, 
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Optional: request/response interceptors
http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize errors
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.message ||
      "Something went wrong";
    return Promise.reject({ status, message, raw: err });
  }
);
