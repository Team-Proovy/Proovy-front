import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  getMySubscription,
  deleteAccount,
} from "../api/user_api";
import { tokenUtils } from "@/shared/api/client";

// Query Keys
export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  subscription: () => [...userKeys.all, "subscription"] as const,
};

// 내 프로필 조회 Hook
export const useMyProfile = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const response = await getMyProfile();
      return response.result;
    },
    // 개발 환경에서는 항상 실행, 프로덕션에서는 토큰 필요
    enabled: import.meta.env.DEV || !!tokenUtils.getAccessToken(),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 내 구독 정보 조회 Hook
export const useMySubscription = () => {
  return useQuery({
    queryKey: userKeys.subscription(),
    queryFn: async () => {
      const response = await getMySubscription();
      return response.result;
    },
    enabled: import.meta.env.DEV || !!tokenUtils.getAccessToken(),
    staleTime: 1000 * 60 * 5,
  });
};

// 회원 탈퇴 Hook
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      tokenUtils.clearTokens();
      queryClient.clear();
      window.location.href = "/";
    },
  });
};
