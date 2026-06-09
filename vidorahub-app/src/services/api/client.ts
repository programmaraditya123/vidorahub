import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';
import type { ApiError } from '@/types';
import { getSecureToken } from '@/lib/storage/secureStore';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: config.requestTimeout,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (req) => {
    const token = await getSecureToken();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
      const status = err.response?.status;
      const message =
        (err.response?.data as { message?: string })?.message ??
        err.message ??
        'Something went wrong';

      const original = err.config as RetryConfig | undefined;

      if (status === 503 && original && !original._retry) {
        original._retry = true;
        await new Promise((r) => setTimeout(r, 1000));
        return client(original);
      }

      const apiError: ApiError = { status, message, raw: err };
      return Promise.reject(apiError);
    },
  );

  return client;
}

export const http = createApiClient(config.apiBaseUrl);
export const http2 = createApiClient(config.apiBaseUrlSecond);
