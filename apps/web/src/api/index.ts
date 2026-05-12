import axios, { AxiosHeaders, type AxiosRequestConfig } from "axios";

interface TypedApi {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

type ApiAuthTokenGetter =
  | null
  | (() => string | null | undefined | Promise<string | null | undefined>);

let apiAuthTokenGetter: ApiAuthTokenGetter = null;

export const setApiAuthTokenGetter = (getter: ApiAuthTokenGetter) => {
  apiAuthTokenGetter = getter;
};

const _api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

_api.interceptors.request.use(async (config) => {
  const token = (await apiAuthTokenGetter?.()) ?? null;

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

_api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err),
);

export const api = _api as unknown as TypedApi;
