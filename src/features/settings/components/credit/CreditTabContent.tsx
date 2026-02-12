import { CreditInfoContainer } from "./CreditInfoContainer";
import {
  CreditHistoryTable,
  type CreditHistoryItem,
} from "./CreditHistoryTable";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreditHistory } from "../../hooks/useCredit";
import { useAuthStore } from "../../../auth/store/auth_store";
import { userKeys, useMyProfile } from "../../hooks/useUser";

export const CreditTabContent = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // React Query Hook 사용
  const { data: creditData } = useCreditHistory({
    page: 0,
    size: 20,
  });

  const { data: profile } = useMyProfile();

  useEffect(() => {
    if (creditData) {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    }
  }, [creditData, queryClient]);

  const history: CreditHistoryItem[] =
    creditData?.history.content.map((item) => {
      const date = new Date(item.createdAt);
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(
        2,
        "0",
      )} ${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
      ).padStart(2, "0")}`;

      return {
        id: item.historyId,
        eventType: item.eventName || item.eventType,
        detail: item.description,
        date: formattedDate,
        change: item.changeType === "EARN" ? item.amount : -item.amount,
      };
    }) || [];

  // 데이터가 없거나 에러 발생 시 기본값으로 UI 유지
  // 사이드바와 동일하게 useMyProfile 데이터 사용
  const safeDailyCredit = profile?.credit.dailyCredit || {
    balance: 0,
    limit: 100, // 기본값
    resetsAt: new Date().toISOString(),
  };

  // 일일 리셋 시간 포맷팅 (예: 매일 00:00)
  const resetDate = new Date(safeDailyCredit.resetsAt);
  const resetTimeStr = `매일 ${resetDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}에 ${safeDailyCredit.limit}으로 새로고침`;

  return (
    <div className="flex h-full flex-col pb-[24px]">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        크레딧 사용내역
      </h3>
      {/* 구분선 */}
      <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 크레딧 정보 컨테이너 */}
      <CreditInfoContainer
        plan={user?.plan || "Free"}
        monthlyCreditBalance={profile?.credit.monthlyCredit.balance || 0}
        monthlyCreditLimit={profile?.credit.monthlyCredit.limit || 0}
        dailyCreditBalance={profile?.credit.dailyCredit.balance || 0}
        dailyCreditLimit={profile?.credit.dailyCredit.limit || 100}
        dailyResetTime={resetTimeStr}
      />

      {/* 크레딧 사용 내역 테이블 */}
      <div className="mt-[20px] min-h-0 flex-1">
        <CreditHistoryTable history={history} />
      </div>
    </div>
  );
};
