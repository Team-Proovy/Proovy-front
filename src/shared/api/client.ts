import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, TokenDto } from "./shared_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 토큰 저장 키
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

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

// Response Interceptor - 토큰 만료 및 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 1. 로그인 관련 API는 즉시 거절 (무한 리다이렉트 방지)
    if (originalRequest.url?.includes("/api/auth/login/kakao")) {
      return Promise.reject(error);
    }

    // 2. 401 에러(인증 만료) 처리 시작
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 💡 [수정] 변수 이름이 아니라 utils를 통해 실제 값을 가져와야 합니다.
      const storedRefreshToken = tokenUtils.getRefreshToken();

      // 💡 [중요] 리프레시 토큰이 없으면 리다이렉트하지 않고 조용히 에러만 던집니다.
      // 이렇게 해야 로그인 직후 튕기는 현상을 막을 수 있습니다.
      if (!storedRefreshToken) {
        console.warn(
          "[Auth] 인증 필요 - 리프레시 토큰 없음 (로그인 페이지로 튕기지 않음)",
        );
        return Promise.reject(error);
      }

      // 이미 토큰 갱신 중인 경우 큐에 추가
      if (isRefreshing) {
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

      try {
        // 실제 토큰 갱신 요청
        const response = await axios.post<ApiResponse<TokenDto>>(
          `${BASE_URL}/api/auth/token/refresh`,
          { refreshToken: storedRefreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.result;

        // 새로운 토큰들 저장
        tokenUtils.setTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);

        // 갱신 자체에 실패한 경우에만 로그인 페이지로 보냅니다 (배포 환경)
        if (!import.meta.env.DEV) {
          tokenUtils.clearTokens();
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
