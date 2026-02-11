import { CreditInfoContainer } from "./CreditInfoContainer";
import {
  CreditHistoryTable,
  type CreditHistoryItem,
} from "./CreditHistoryTable";
import { useCreditHistory } from "../../hooks/useCredit";
import type { CreditSummaryDto } from "../../api/credit_types";
import { useAuthStore } from "../../../auth/store/auth_store";
import { Skeleton } from "@/shared/components/ui/Skeleton";

/**
 * CreditTabContent - 크레딧 사용내역 탭
 */
export const CreditTabContent = () => {
  const { user } = useAuthStore();

  // React Query Hook 사용
  const { data: creditData, isLoading: loading } = useCreditHistory({
    page: 0,
    size: 20,
  });

  const summary = creditData?.creditSummary || null;

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
        change: item.changeType === "SPEND" ? -item.amount : item.amount,
      };
    }) || [];

  // 로딩 상태일 때 스켈레톤 UI
  if (loading) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden">
        <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
          크레딧 사용내역
        </h3>
        {/* 구분선 */}
        <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

        {/* 정보 카드 스켈레톤 - CreditInfoContainer 내부 구조 모방 (반응형 w-full) */}
        <div className="flex h-[240px] w-full flex-col rounded-[12px] bg-[#F1F4F8] px-[24px] py-[20px]">
          {/* 상단: 요금제 + 업그레이드 버튼 */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-[20px] w-[60px]" /> {/* 요금제 이름 */}
            <Skeleton className="h-[28px] w-[100px] rounded-[18px]" />{" "}
            {/* 버튼 */}
          </div>

          <div className="mt-[12px] h-[1px] bg-[#D1D6DE]" />

          {/* 크레딧 정보 */}
          <div className="mt-[19px] flex items-center justify-between">
            <div className="flex items-center gap-[4px]">
              <Skeleton className="h-[25px] w-[25px] rounded-full" />{" "}
              {/* 아이콘 */}
              <div className="flex flex-col gap-[4px]">
                <Skeleton className="h-[14px] w-[50px]" />
                <Skeleton className="h-[12px] w-[70px]" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-[4px]">
              <Skeleton className="h-[14px] w-[80px]" />
              <Skeleton className="h-[12px] w-[60px]" />
            </div>
          </div>

          {/* 일일 지급 크레딧 */}
          <div className="mt-[32px] flex items-start justify-between">
            <div className="flex items-center gap-[4px]">
              <Skeleton className="h-[25px] w-[25px] rounded-full" />{" "}
              {/* 아이콘 */}
              <div className="flex flex-col gap-[4px]">
                <Skeleton className="h-[14px] w-[100px]" />
                <Skeleton className="h-[12px] w-[180px]" />
              </div>
            </div>
            <Skeleton className="h-[14px] w-[40px]" />
          </div>
        </div>

        {/* 테이블 스켈레톤 - 헤더 + 로딩 로우 */}
        <div className="mt-[20px]">
          <div className="flex h-[240px] w-full flex-col overflow-hidden rounded-[12px] border border-[0.5px] border-[#D1D6DE]">
            {/* 테이블 헤더 (고정) */}
            <div className="grid grid-cols-[140px_280px_180px_1fr] gap-[10px] rounded-t-[12px] bg-[#F1F4F8] px-[23px] py-[7px]">
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
                이벤트 내용
              </span>
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
                세부사항
              </span>
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
                날짜
              </span>
              <span className="text-right font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
                크레딧 변경
              </span>
            </div>

            {/* 테이블 바디 스켈레톤 로우 - 스크롤바가 생기도록 충분한 개수(10개) 렌더링 */}
            <div className="flex-1 overflow-y-auto px-[23px] py-[15px]">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-[10px] grid grid-cols-[140px_280px_180px_1fr] gap-[10px]"
                >
                  <Skeleton className="h-[14px] w-[100px]" />
                  <Skeleton className="h-[14px] w-[200px]" />
                  <Skeleton className="h-[14px] w-[120px]" />
                  <div className="flex justify-end">
                    <Skeleton className="h-[14px] w-[50px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없거나 에러 발생 시 기본값으로 UI 유지
  const safeDailyFreeCredit = summary?.dailyFreeCredit || {
    amount: 0,
    balance: 0,
    limit: 100, // 기본값
    expiresAt: new Date().toISOString(),
  };

  const safeTotalAvailable = summary?.totalAvailable || 0;

  // 일일 리셋 시간 포맷팅 (예: 매일 00:00)
  const resetDate = new Date(safeDailyFreeCredit.expiresAt);
  const resetTimeStr = `매일 ${resetDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}에 ${safeDailyFreeCredit.limit}으로 새로고침`;

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
        usedCredits={0}
        dailyCredits={safeDailyFreeCredit.balance}
        dailyResetTime={resetTimeStr}
      />

      {/* 크레딧 사용 내역 테이블 */}
      <div className="mt-[20px]">
        <CreditHistoryTable history={history} />
      </div>
    </div>
  );
};
