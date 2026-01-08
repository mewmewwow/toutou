import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ErrorResponse } from 'shared/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
}

// Device fingerprint management
let deviceFingerprint: string | null = null;

export function setDeviceFingerprint(fingerprint: string): void {
  deviceFingerprint = fingerprint;
  localStorage.setItem('deviceFingerprint', fingerprint);
}

export function getDeviceFingerprint(): string | null {
  if (!deviceFingerprint) {
    deviceFingerprint = localStorage.getItem('deviceFingerprint');
  }
  return deviceFingerprint;
}

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add device fingerprint for guest auth
    const fingerprint = getDeviceFingerprint();
    if (fingerprint) {
      config.headers['X-Device-Fingerprint'] = fingerprint;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newToken, refreshToken: newRefreshToken } = response.data;
          setAccessToken(newToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens
          setAccessToken(null);
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// Error handling helper
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return axiosError.response?.data?.message || error.message || '请求失败';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}

export function getErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return axiosError.response?.data?.code || null;
  }
  return null;
}
