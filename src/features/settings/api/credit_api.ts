import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  CreditHistoryResultDto,
  GetCreditHistoryParams,
} from "./credit_types";

const CREDIT_BASE = "/api/credits";

// 크레딧 사용 내역 및 요약 조회
export const getCreditHistory = async (
  params?: GetCreditHistoryParams,
): Promise<ApiResponse<CreditHistoryResultDto>> => {
  const response = await apiClient.get<ApiResponse<CreditHistoryResultDto>>(
    `${CREDIT_BASE}/history`,
    {
      params,
    },
  );
  return response.data;
};
