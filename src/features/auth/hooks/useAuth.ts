import { useMutation, useQueryClient } from "@tanstack/react-query";
import { socialLogin, signupComplete, logout } from "../api/auth_api";
import { tokenUtils } from "@/shared/api/client";
import type { SocialLoginRequest, SignupCompleteRequest } from "../api/types";

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// 소셜 로그인 Hook
export const useSocialLogin = (provider: "kakao" | "naver" | "google") => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SocialLoginRequest) => socialLogin(provider, data),
    onSuccess: (response) => {
      const result = response.result;

      if (
        result.status === "LOGIN" &&
        result.accessToken &&
        result.refreshToken
      ) {
        // 로그인 성공 - 토큰 저장
        tokenUtils.setTokens(result.accessToken, result.refreshToken);
        queryClient.invalidateQueries({ queryKey: authKeys.user() });
      }
      // SIGNUP_REQUIRED인 경우 tempToken은 컴포넌트에서 처리
    },
  });
};

// 회원가입 완료 Hook
export const useSignupComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignupCompleteRequest) => signupComplete(data),
    onSuccess: (response) => {
      const { token } = response.result;
      tokenUtils.setTokens(token.accessToken, token.refreshToken);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

// 로그아웃 Hook
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      tokenUtils.clearTokens();
      queryClient.clear();
    },
    onError: () => {
      // 에러가 나도 로컬 토큰은 삭제
      tokenUtils.clearTokens();
      queryClient.clear();
    },
  });
};
