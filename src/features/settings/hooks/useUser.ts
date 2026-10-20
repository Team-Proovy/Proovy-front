import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  getMySubscription,
  deleteAccount,
  cancelSubscription,
  upgradeSubscription,
  resumeSubscription,
} from "../api/user_api";
import { tokenUtils } from "@/shared/api/client";
import type { UpgradeSubscriptionRequest } from "../api/user_types";

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
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      tokenUtils.clearTokens();
      window.location.href = "/";
    },
  });
};

// 구독 취소 Hook
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // SubscriptionTabContent에서 자체 토스트로 처리 → 전역 토스트 제외
    meta: { suppressGlobalErrorToast: true },
    mutationFn: cancelSubscription,
    onSuccess: (response) => {
      if (response.isSuccess) {
        queryClient.invalidateQueries({ queryKey: userKeys.subscription() });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      }
    },
  });
};

// 구독 업그레이드 Hook
export const useUpgradeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // PricingPage에서 자체 토스트로 처리 → 전역 토스트 제외
    meta: { suppressGlobalErrorToast: true },
    mutationFn: (data: UpgradeSubscriptionRequest) => upgradeSubscription(data),
    onSuccess: (response) => {
      if (response.isSuccess) {
        queryClient.invalidateQueries({ queryKey: userKeys.subscription() });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      }
    },
  });
};

// 구독 재개 Hook
export const useResumeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // SubscriptionTabContent에서 자체 토스트로 처리 → 전역 토스트 제외
    meta: { suppressGlobalErrorToast: true },
    mutationFn: resumeSubscription,
    onSuccess: (response) => {
      if (response.isSuccess) {
        queryClient.invalidateQueries({ queryKey: userKeys.subscription() });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      }
    },
  });
};
