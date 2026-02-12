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

/**
 * CreditTabContent - 크레딧 사용내역 탭
 */
export const CreditTabContent = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // React Query Hook 사용
  const { data: creditData } = useCreditHistory({
    page: 0,
    size: 20,
  });

  // 프로필 데이터 (사이드바와 동일한 소스 사용 - 크레딧 정보 동기화 위함)
  const { data: profile } = useMyProfile();

  // 크레딧 데이터가 변경되면(refetch 등) 프로필 데이터도 갱신하여 사이드바 동기화
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
        remainingCredit:
          item.balanceAfter.daily +
          item.balanceAfter.free +
          item.balanceAfter.paid,
      };
    }) || [];

  // 데이터가 없거나 에러 발생 시 기본값으로 UI 유지
  // 사이드바와 동일하게 useMyProfile 데이터 사용
  const safeDailyCredit = profile?.credit.dailyCredit || {
    balance: 0,
    limit: 100, // 기본값
    resetsAt: new Date().toISOString(),
  };

  const safeTotalAvailable = profile?.credit.totalAvailable || 0;

  // 일일 리셋 시간 포맷팅 (예: 매일 00:00)
  const resetDate = new Date(safeDailyCredit.resetsAt);
  const resetTimeStr = `매일 ${resetDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}에 ${safeDailyCredit.limit}으로 새로고침`;

  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        크레딧 사용내역
      </h3>
      {/* 구분선 */}
      <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 크레딧 정보 컨테이너 */}
      <CreditInfoContainer
        plan={user?.plan || "Free"}
        totalCredits={safeTotalAvailable}
        // 사용자가 아직 무료 크레딧을 받지 않았으므로 0으로 고정 요청함
        // 추후 프로필 API에 무료/보너스 크레딧 필드가 생기면 해당 값으로 매핑 필요
        usedCredits={0}
        dailyCredits={safeDailyCredit.balance}
        dailyResetTime={resetTimeStr}
      />

      {/* 크레딧 사용 내역 테이블 */}
      <div className="mt-[20px]">
        <CreditHistoryTable history={history} />
      </div>
    </div>
  );
};
