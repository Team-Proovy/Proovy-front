import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import type {
  SocialLoginRequest,
  SocialLoginResponse,
  SignupCompleteRequest,
  SignupCompleteResponse,
  TokenRefreshRequest,
} from "./types";
import type { TokenDto } from "@/shared/api/types";

const AUTH_BASE = "/api/auth";

// 소셜 로그인 (카카오, 네이버, 구글)
export const socialLogin = async (
  provider: "kakao" | "naver" | "google",
  data: SocialLoginRequest,
): Promise<ApiResponse<SocialLoginResponse>> => {
  const response = await apiClient.post<ApiResponse<SocialLoginResponse>>(
    `${AUTH_BASE}/login/${provider}`,
    data,
  );
  return response.data;
};

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
