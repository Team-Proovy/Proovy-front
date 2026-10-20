import { useQuery } from "@tanstack/react-query";
import { getCreditHistory } from "../api/credit_api";
import type { GetCreditHistoryParams } from "../api/credit_types";
import { tokenUtils } from "@/shared/api/client";

export const creditKeys = {
  all: ["credit"] as const,
  history: (params: GetCreditHistoryParams) =>
    [...creditKeys.all, "history", params] as const,
};

export const useCreditHistory = (params: GetCreditHistoryParams) => {
  return useQuery({
    queryKey: creditKeys.history(params),
    queryFn: async () => {
      const response = await getCreditHistory(params);
      return response.result;
    },
    enabled: !!tokenUtils.getAccessToken(),
    staleTime: 1000 * 60 * 1, // 1분
  });
};
