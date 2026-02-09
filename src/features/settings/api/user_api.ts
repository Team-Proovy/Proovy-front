import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  MyProfileResponse,
  SubscriptionResponse,
  SubscriptionUpdateRequest,
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
