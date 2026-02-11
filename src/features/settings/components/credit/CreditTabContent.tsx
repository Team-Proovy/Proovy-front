import { useEffect, useState } from "react";
import { CreditInfoContainer } from "./CreditInfoContainer";
import {
  CreditHistoryTable,
  type CreditHistoryItem,
} from "./CreditHistoryTable";
import { getCreditHistory } from "../../api/credit_api";
import type { CreditSummaryDto } from "../../api/credit_types";
import { useAuthStore } from "../../../auth/store/auth_store";

/**
 * CreditTabContent - 크레딧 사용내역 탭
 */
export const CreditTabContent = () => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<CreditSummaryDto | null>(null);
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getCreditHistory({
          page: 0,
          size: 20,
          // 필요시 필터 추가
        });

        if (response.isSuccess && response.result) {
          setSummary(response.result.creditSummary);

          // 히스토리 매핑
          const historyItems: CreditHistoryItem[] =
            response.result.history.content.map((item) => {
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
                eventType: item.eventName || item.eventType, // eventName이 없으면 타입 사용
                detail: item.description,
                date: formattedDate,
                change:
                  item.changeType === "SPEND" ? -item.amount : item.amount,
              };
            });
          setHistory(historyItems);
        }
      } catch (error) {
        console.error("Failed to fetch credit history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        로딩 중...
      </div>
    );
  }

  // 데이터가 없을 경우 기본값 또는 빈 상태 처리
  if (!summary) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const { dailyFreeCredit, totalAvailable } = summary;

  // 일일 리셋 시간 포맷팅 (예: 매일 00:00)
  const resetDate = new Date(dailyFreeCredit.expiresAt);
  const resetTimeStr = `매일 ${resetDate.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}에 ${dailyFreeCredit.limit}으로 새로고침`;

  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        크레딧 사용내역
      </h3>
      {/* 구분선 */}
      <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 크레딧 정보 컨테이너 - 770x240 */}
      <CreditInfoContainer
        plan={user?.plan || "Free"}
        totalCredits={totalAvailable}
        usedCredits={0} // API 응답에 사용량 총계가 없으므로 0 또는 별도 계산 필요 (여기서는 API에 사용량 제공 안됨)
        // 만약 기간별 사용량(periodSummary.totalSpent)을 보여주고 싶다면 API 응답에서 periodSummary를 상태로 저장해 사용
        dailyCredits={dailyFreeCredit.balance}
        dailyResetTime={resetTimeStr}
      />

      {/* 크레딧 사용 내역 테이블 - 770x240 */}
      <div className="mt-[20px]">
        <CreditHistoryTable history={history} />
      </div>
    </div>
  );
};
