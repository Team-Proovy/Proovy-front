import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  MyProfileResponse,
  SubscriptionResponse,
  SubscriptionUpdateRequest,
  UpgradeSubscriptionRequest,
  CancelSubscriptionResponse,
} from "./user_types";

const USER_BASE = "/api/users";

// 내 프로필 조회
export const getMyProfile = async (): Promise<
  ApiResponse<MyProfileResponse>
> => {
  const response = await apiClient.get<ApiResponse<MyProfileResponse>>(
    `${USER_BASE}/me`,
  );
  return response.data;
};

// 내 프로필 수정
export const updateProfile = async (
  data: import("./user_types").UpdateProfileRequest,
): Promise<ApiResponse<import("./user_types").MyProfileResponse>> => {
  const response = await apiClient.patch<
    ApiResponse<import("./user_types").MyProfileResponse>
  >(`${USER_BASE}/me`, data);
  return response.data;
};

// 내 구독 상세 정보 조회
export const getMySubscription = async (): Promise<
  ApiResponse<SubscriptionResponse>
> => {
  const response = await apiClient.get<ApiResponse<SubscriptionResponse>>(
    `${USER_BASE}/me/subscription`,
  );
  return response.data;
};

// 회원 탈퇴
export const deleteAccount = async (): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`${USER_BASE}/me`);
  return response.data;
};

// 구독 변경
export const updateSubscription = async (
  data: SubscriptionUpdateRequest,
): Promise<ApiResponse<SubscriptionResponse>> => {
  const response = await apiClient.patch<ApiResponse<SubscriptionResponse>>(
    `${USER_BASE}/me/subscription`,
    data,
  );
  return response.data;
};

// 구독 업그레이드
export const upgradeSubscription = async (
  data: UpgradeSubscriptionRequest,
): Promise<ApiResponse<SubscriptionResponse>> => {
  const response = await apiClient.patch<ApiResponse<SubscriptionResponse>>(
    `${USER_BASE}/me/subscription/upgrade`,
    data,
  );
  return response.data;
};

// 구독 취소
export const cancelSubscription = async (): Promise<
  ApiResponse<CancelSubscriptionResponse>
> => {
  const response = await apiClient.patch<
    ApiResponse<CancelSubscriptionResponse>
  >(`${USER_BASE}/me/subscription/cancel`);
  return response.data;
};
