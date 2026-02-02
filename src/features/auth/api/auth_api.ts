import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  LoginResult,
  SignupCompleteRequest,
  SignupCompleteResponse,
  TokenRefreshRequest,
  SocialLoginRequest,
} from "./auth_types";
import type { TokenDto } from "@/shared/api/shared_types";

// ============================================================
// 환경변수 (카카오 로그인용)
// ============================================================
export const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
export const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) {
  throw new Error(
    "필수 환경변수가 누락되었습니다: VITE_KAKAO_CLIENT_ID, VITE_KAKAO_REDIRECT_URI",
  );
}

const AUTH_BASE = "/api/auth";

// ============================================================
// 카카오 로그인 (현재 구현됨)
// ============================================================
export const loginWithKakao = async (
  code: string,
): Promise<ApiResponse<LoginResult>> => {
  const response = await apiClient.post<ApiResponse<LoginResult>>(
    `${AUTH_BASE}/login/kakao`,
    {
      authorizationCode: code,
    },
  );
  return response.data;
};

// 소셜 로그인 (통합) - kakao, naver, google 지원
export const socialLogin = async (
  provider: "kakao" | "naver" | "google",
  data: SocialLoginRequest,
): Promise<ApiResponse<LoginResult>> => {
  const response = await apiClient.post<ApiResponse<LoginResult>>(
    `${AUTH_BASE}/login/${provider}`,
    data,
  );
  return response.data;
};

// ============================================================
// 추가 Auth API (향후 구현)
// ============================================================

// 회원가입 완료 (추가 정보 입력)
export const signupComplete = async (
  data: SignupCompleteRequest,
): Promise<ApiResponse<SignupCompleteResponse>> => {
  const response = await apiClient.post<ApiResponse<SignupCompleteResponse>>(
    `${AUTH_BASE}/signup/complete`,
    data,
  );
  return response.data;
};

// 토큰 갱신
export const refreshToken = async (
  data: TokenRefreshRequest,
): Promise<ApiResponse<TokenDto>> => {
  const response = await apiClient.post<ApiResponse<TokenDto>>(
    `${AUTH_BASE}/token/refresh`,
    data,
  );
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `${AUTH_BASE}/logout`,
  );
  return response.data;
};
