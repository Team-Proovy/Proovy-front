import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCreditHistory, useCredit } from "../api/credit_api";
import type {
  CreditUsageRequest,
  GetCreditHistoryParams,
} from "../api/credit_types";
import { tokenUtils } from "@/shared/api/client";
import { userKeys } from "./useUser";

import type { MyProfileResponse } from "../api/user_types";

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
    onMutate: async (variables: CreditUsageRequest) => {
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      const previousProfile = queryClient.getQueryData<MyProfileResponse>(
        userKeys.profile(),
      );

      if (!previousProfile) {
        return { previousProfile };
      }

      const optimisticAmount = Math.max(variables.amount ?? 15, 0);

      const currentDaily = previousProfile.credit.dailyCredit.balance;
      const currentMonthly = previousProfile.credit.monthlyCredit.balance;

      const nextDaily = Math.max(currentDaily - optimisticAmount, 0);
      const remainingAmount = Math.max(optimisticAmount - currentDaily, 0);
      const nextMonthly = Math.max(currentMonthly - remainingAmount, 0);

      queryClient.setQueryData<MyProfileResponse>(userKeys.profile(), {
        ...previousProfile,
        credit: {
          ...previousProfile.credit,
          dailyCredit: {
            ...previousProfile.credit.dailyCredit,
            balance: nextDaily,
          },
          monthlyCredit: {
            ...previousProfile.credit.monthlyCredit,
            balance: nextMonthly,
          },
          totalAvailable: Math.max(
            previousProfile.credit.totalAvailable - optimisticAmount,
            0,
          ),
        },
      });

      return { previousProfile };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      }
    },
    onSuccess: (data) => {
      if (data.result.success) {
        const newBalance = data.result.balance;
        queryClient.setQueryData<MyProfileResponse>(
          userKeys.profile(),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              credit: {
                ...oldData.credit,
                dailyCredit: {
                  ...oldData.credit.dailyCredit,
                  balance: newBalance.dailyFreeCredit,
                },
                monthlyCredit: {
                  ...oldData.credit.monthlyCredit,
                  balance: newBalance.freeCredit + newBalance.paidCredit,
                },
                totalAvailable: newBalance.totalAvailable,
              },
            };
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: creditKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};
