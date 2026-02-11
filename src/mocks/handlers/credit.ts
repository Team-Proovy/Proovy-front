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

  // 크레딧 사용
  http.post("/api/credits/use", async () => {
    return HttpResponse.json({
      isSuccess: true,
      code: "COMMON200",
      message: "요청에 성공했습니다.",
      result: {
        success: true,
        usedAmount: 15,
        balance: {
          dailyFreeCredit: 65,
          freeCredit: 50,
          paidCredit: 120,
          totalAvailable: 235,
        },
        insufficientCredit: false,
        message: "크레딧이 차감되었습니다.",
      },
    });
  }),

  // 크레딧 비용 조회
  http.get("/api/credits/costs", () => {
    return HttpResponse.json({
      isSuccess: true,
      code: "COMMON200",
      message: "요청에 성공했습니다.",
      result: {
        costs: [
          {
            eventType: "OCR",
            description: "OCR 처리",
            costAmount: 10,
            isFixed: true,
          },
          {
            eventType: "CODE_EXECUTION",
            description: "코드 실행",
            costAmount: 5,
            isFixed: true,
          },
          {
            eventType: "LLM_QUERY",
            description: "AI 질의 (사용량 기반)",
            costAmount: null,
            isFixed: false,
          },
        ],
        featureCosts: [
          {
            featureName: "Solve",
            baseCost: 10,
            easyCost: 10,
            mediumCost: 15,
            hardCost: 20,
          },
          {
            featureName: "Explain",
            baseCost: 5,
            easyCost: 5,
            mediumCost: 8,
            hardCost: 10,
          },
        ],
        difficultyMultipliers: {
          easy: 1.0,
          medium: 1.5,
          hard: 2.0,
        },
      },
    });
  }),

  // 크레딧 잔액 조회
  http.get("/api/credits/balance", ({ request }) => {
    const url = new URL(request.url);
    const checkCost = url.searchParams.get("checkCost");

    return HttpResponse.json({
      isSuccess: true,
      code: "COMMON200",
      message: "요청에 성공했습니다.",
      result: {
        dailyFreeCredit: 80,
        dailyFreeLimit: 100,
        dailyExpiresAt: "2026-01-31T00:00:00",
        freeCredit: 50,
        paidCredit: 120,
        paidExpiresAt: "2026-02-28T00:00:00",
        totalAvailable: 250,
        canUse: true,
        checkedCost: checkCost ? Number(checkCost) : undefined,
      },
    });
  }),

  // 예상 비용 조회
  http.get("/api/credits/estimate", async () => {
    return HttpResponse.json({
      isSuccess: true,
      code: "COMMON200",
      message: "요청에 성공했습니다.",
      result: 15,
    });
  }),
];
