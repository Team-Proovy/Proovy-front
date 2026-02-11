import { http, HttpResponse } from "msw";
import type { CreditHistoryResultDto } from "../../features/settings/api/credit_types";

export const creditHandlers = [
  // 크레딧 히스토리 조회
  http.get("/api/credits/history", () => {
    const mockData: CreditHistoryResultDto = {
      creditSummary: {
        dailyFreeCredit: {
          balance: 100,
          limit: 100,
          expiresAt: new Date().toISOString(),
        },
        freeCredit: {
          balance: 0,
        },
        paidCredit: {
          balance: 0,
        },
        totalAvailable: 100,
      },
      history: {
        content: [
          {
            historyId: 1,
            eventType: "DAILY_RESET",
            eventName: "일일 크레딧 지급",
            description: "매일 제공되는 무료 크레딧",
            amount: 100,
            changeType: "EARN",
            creditType: "DAILY",
            balanceAfter: { daily: 100, free: 0, paid: 0 },
            createdAt: new Date().toISOString(),
          },
          {
            historyId: 2,
            eventType: "LLM_QUERY",
            eventName: "메시지 전송",
            description: "AI 답변 생성",
            amount: 10,
            changeType: "SPEND",
            creditType: "DAILY",
            balanceAfter: { daily: 90, free: 0, paid: 0 },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        pageInfo: {
          page: 0,
          size: 20,
          totalElements: 2,
          totalPages: 1,
          hasNext: false,
        },
      },
      periodSummary: {
        totalEarned: 100,
        totalSpent: 10,
        totalExpired: 0,
        periodStart: "2024-02-01",
        periodEnd: "2024-02-29",
      },
    };

    return HttpResponse.json({
      isSuccess: true,
      message: "성공",
      result: mockData,
    });
  }),
];
