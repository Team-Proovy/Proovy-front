import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, TokenDto } from "./shared_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 토큰 저장 키
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const SHOULD_ENABLE_ERROR_REDIRECT =
  import.meta.env.VITE_ENABLE_ERROR_REDIRECT === "true" || !import.meta.env.DEV;

const ERROR_ROUTE_BY_CODE: Record<string, string> = {
  TOKEN401: "/error/401",
  TOKEN402: "/error/401",
  AUTH403: "/error/403",
  COMMON404: "/error/404",
  SERVER500: "/error/500",
};

const ERROR_CODE_PATTERNS: Array<{ pattern: RegExp; route: string }> = [
  { pattern: /^[A-Z]+401\d*$/, route: "/error/401" },
  { pattern: /^[A-Z]+403\d*$/, route: "/error/403" },
  { pattern: /^[A-Z]+404\d*$/, route: "/error/404" },
  { pattern: /^[A-Z]+5\d{2}\d*$/, route: "/error/500" },
];

const ERROR_ROUTE_BY_STATUS: Record<number, string> = {
  401: "/error/401",
  403: "/error/403",
  404: "/error/404",
  500: "/error/500",
};

const redirectToErrorRoute = (route: string) => {
  if (!SHOULD_ENABLE_ERROR_REDIRECT) return;

  const currentPath = window.location.pathname;
  if (currentPath === route || currentPath.startsWith("/error/")) return;

  window.history.replaceState(window.history.state, "", route);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const resolveErrorRoute = (error: AxiosError) => {
  const status = error.response?.status;
  const responseData = error.response?.data as
    | Partial<ApiResponse<unknown>>
    | undefined;
  const code = responseData?.code?.toString().trim().toUpperCase();

  if (code && ERROR_ROUTE_BY_CODE[code]) {
    return ERROR_ROUTE_BY_CODE[code];
  }

  if (code) {
    const matchedPattern = ERROR_CODE_PATTERNS.find(({ pattern }) =>
      pattern.test(code),
    );
    if (matchedPattern) {
      return matchedPattern.route;
    }
  }

  if (status && ERROR_ROUTE_BY_STATUS[status]) {
    return ERROR_ROUTE_BY_STATUS[status];
  }

  return null;
};

// 토큰 관리 유틸
export const tokenUtils = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor - 토큰 만료 시 자동 갱신
let isRefreshing = false; // 현재 토큰 갱신 여부 체크
let failedQueue: Array<{
  // 갱신하는 동안 실패한 요청들을 모아두는 대기큐
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  // 대기큐를 처리하는 함수
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      skipErrorRedirect?: boolean;
      meta?: {
        suppressRedirect?: boolean;
      };
    };
    const shouldSuppressRedirect = Boolean(
      originalRequest?.skipErrorRedirect ||
      originalRequest?.meta?.suppressRedirect,
    );

    // 401 에러이고 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenUtils.getRefreshToken();

      if (!refreshToken) {
        tokenUtils.clearTokens();
        if (!shouldSuppressRedirect) {
          redirectToErrorRoute("/error/401");
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<ApiResponse<TokenDto>>(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.result;
        tokenUtils.setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        tokenUtils.clearTokens();
        if (!shouldSuppressRedirect) {
          redirectToErrorRoute("/error/401");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!shouldSuppressRedirect) {
      const errorRoute = resolveErrorRoute(error);
      if (errorRoute) {
        redirectToErrorRoute(errorRoute);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
