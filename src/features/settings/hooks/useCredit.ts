import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCreditHistory, useCredit } from "../api/credit_api";
import type { GetCreditHistoryParams } from "../api/credit_types";
import { tokenUtils } from "@/shared/api/client";
import { userKeys } from "./useUser";

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

export const useUseCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: useCredit,
    onSuccess: () => {
      // 크레딧 사용 성공 시 히스토리 및 사용자 프로필(사이드바 크레딧) 갱신
      queryClient.invalidateQueries({ queryKey: creditKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};
