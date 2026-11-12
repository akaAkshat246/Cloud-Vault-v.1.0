/**
 * Axios HTTP Client with Zero-Knowledge Invariants & CSRF Protection
 *
 * Invariants:
 * - withCredentials = true (enables secure HttpOnly cookie handling for cv_refresh_token)
 * - Custom header x-cloudvault-client: web (satisfies backend CSRF middleware)
 * - In-memory access token injection via request interceptor
 * - Automatic silent refresh on 401 with request queuing
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API URL: In development with Vite proxy, use relative '/api'
export const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-cloudvault-client': 'web',
  },
});

// Ephemeral in-memory access token storage
let currentAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried and not on auth endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/v1/auth/login') &&
      !originalRequest.url?.includes('/v1/auth/refresh') &&
      !originalRequest.url?.includes('/v1/auth/prelogin')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger refresh with cookie
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'x-cloudvault-client': 'web',
            },
          }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        // Clear active session event
        window.dispatchEvent(new CustomEvent('cloudvault:session_expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

