import axios from "axios";
import apiClient, { tokenUtils } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  LoginResult,
  SignupCompleteRequest,
  SignupCompleteResponse,
  TokenRefreshRequest,
  SocialLoginRequest,
} from "./auth_types";
import type { TokenDto } from "@/shared/api/shared_types";

export const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
export const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
export const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
export const NAVER_REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) {
  throw new Error(
    "필수 환경변수가 누락되었습니다: VITE_KAKAO_CLIENT_ID, VITE_KAKAO_REDIRECT_URI",
  );
}

const AUTH_BASE = "/api/auth";

export const loginWithKakao = async (
  code: string,
): Promise<ApiResponse<LoginResult>> => {
  const response = await axios.post<ApiResponse<LoginResult>>(
    `${BASE_URL}${AUTH_BASE}/login/kakao`,
    {
      authorizationCode: code,
      redirectUri: KAKAO_REDIRECT_URI,
    },
  );
  const result = response.data.result;
  if (response.data.isSuccess && result && result.token) {
    const { accessToken, refreshToken } = result.token;
    if (accessToken && refreshToken) {
      tokenUtils.setTokens(accessToken, refreshToken);
    }
  }

  return response.data;
};

export const loginWithNaver = async (
  code: string,
  state: string,
): Promise<ApiResponse<LoginResult>> => {
  const response = await axios.post<ApiResponse<LoginResult>>(
    `${BASE_URL}${AUTH_BASE}/login/naver`,
    {
      code,
      state,
      redirectUri: NAVER_REDIRECT_URI,
    },
  );

  const result = response.data.result;
  if (response.data.isSuccess && result && result.token) {
    const { accessToken, refreshToken } = result.token;

    if (accessToken && refreshToken) {
      tokenUtils.setTokens(accessToken, refreshToken);
    }
  }
  return response.data;
};

// 소셜 로그인 (통합) - kakao, naver 지원 (토큰 없이 호출)
export const socialLogin = async (
  provider: "kakao" | "naver",
  data: SocialLoginRequest,
): Promise<ApiResponse<LoginResult>> => {
  const response = await axios.post<ApiResponse<LoginResult>>(
    `${BASE_URL}${AUTH_BASE}/login/${provider}`,
    data,
  );
  return response.data;
};

// 회원가입 완료 (추가 정보 입력) - signupToken 사용, 토큰 없이 호출
export const signupComplete = async (
  data: SignupCompleteRequest,
): Promise<ApiResponse<SignupCompleteResponse>> => {
  const response = await axios.post<ApiResponse<SignupCompleteResponse>>(
    `${BASE_URL}${AUTH_BASE}/signup/complete`,
    data,
  );
  return response.data;
};

// 토큰 갱신 - refreshToken 사용, 토큰 없이 호출
export const refreshToken = async (
  data: TokenRefreshRequest,
): Promise<ApiResponse<TokenDto>> => {
  const response = await axios.post<ApiResponse<TokenDto>>(
    `${BASE_URL}${AUTH_BASE}/refresh`,
    data,
  );
  return response.data;
};

// 로그아웃 - 인증 필요 (apiClient 사용)
export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `${AUTH_BASE}/logout`,
  );
  return response.data;
};
