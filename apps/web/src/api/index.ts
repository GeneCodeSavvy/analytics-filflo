import axios, { type AxiosRequestConfig } from "axios";

interface TypedApi {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const _api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

_api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err),
);

export const api = _api as unknown as TypedApi;
