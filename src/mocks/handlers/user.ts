import { http, HttpResponse, delay } from "msw";
import type {
  MyProfileResponse,
  SubscriptionResponse,
  DeleteUserResponse,
} from "../../features/settings/api/user_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// 목 데이터
// ============================================================

/** 내 프로필 응답 (목) */
const mockMyProfile: MyProfileResponse = {
  userId: 1,
  email: "user@example.com",
  name: "지현구",
  nickname: "proovy_user",
  department: "컴퓨터공학과",
  profileImageUrl: null,
  provider: "KAKAO",
  createdAt: "2025-01-01T00:00:00",
  subscription: {
    plan: "FREE",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  credit: {
    dailyCredit: {
      balance: 8,
      limit: 10,
      resetsAt: "2025-01-06T00:00:00",
    },
    monthlyCredit: {
      balance: 45,
      limit: 50,
      expiresAt: "2025-01-31T23:59:59",
    },
    totalAvailable: 53,
  },
  storage: {
    used: 125.5,
    limit: 500,
    unit: "MB",
  },
};

/** 구독 정보 상세 응답 (목) */
const mockSubscription: SubscriptionResponse = {
  currentPlan: {
    name: "FREE",
    displayName: "무료 플랜",
    price: 0,
    currency: "KRW",
    billingCycle: "MONTHLY",
  },
  period: {
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    daysRemaining: 360,
  },
  benefits: {
    dailyCredit: 10,
    monthlyCredit: 50,
    maxMonthlyCredit: 50,
    storageLimit: "500MB",
    maxFileSize: "10MB",
    maxNotes: 2,
  },
  billing: {
    nextBillingDate: "",
    autoRenew: false,
  },
  availablePlans: [
    {
      name: "STANDARD",
      displayName: "스탠다드",
      price: 9900,
      currency: "KRW",
      billingCycle: "MONTHLY",
      benefits: {
        dailyCredit: 30,
        monthlyCredit: 200,
        maxMonthlyCredit: 200,
        storageLimit: "5GB",
        maxFileSize: "30MB",
        maxNotes: 10,
      },
    },
    {
      name: "PRO",
      displayName: "프로",
      price: 19900,
      currency: "KRW",
      billingCycle: "MONTHLY",
      benefits: {
        dailyCredit: 100,
        monthlyCredit: 500,
        maxMonthlyCredit: 500,
        storageLimit: "20GB",
        maxFileSize: "30MB",
        maxNotes: 20,
      },
    },
  ],
};

// ============================================================
// User API 핸들러
// ============================================================

export const userHandlers = [
  // 내 프로필 조회
  http.get(`${BASE_URL}/api/users/me`, async ({ request }) => {
    await delay(400);

    // Authorization 헤더 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "AUTH4010",
          message: "인증 토큰이 필요합니다.",
          result: null,
        },
        { status: 401 },
      );
    }

    console.log("[MSW] 내 프로필 조회");

    return HttpResponse.json({
      isSuccess: true,
      code: "USER2000",
      message: "조회 성공",
      result: mockMyProfile,
    });
  }),

  // 내 구독 정보 조회
  http.get(`${BASE_URL}/api/users/me/subscription`, async ({ request }) => {
    await delay(400);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "AUTH4010",
          message: "인증 토큰이 필요합니다.",
          result: null,
        },
        { status: 401 },
      );
    }

    console.log("[MSW] 구독 정보 조회");

    return HttpResponse.json({
      isSuccess: true,
      code: "USER2000",
      message: "구독 정보 조회 성공",
      result: mockSubscription,
    });
  }),

  // 회원 탈퇴
  http.delete(`${BASE_URL}/api/users/me`, async ({ request }) => {
    await delay(500);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "AUTH4010",
          message: "인증 토큰이 필요합니다.",
          result: null,
        },
        { status: 401 },
      );
    }

    console.log("[MSW] 회원 탈퇴");

    const response: DeleteUserResponse = {
      deletedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      isSuccess: true,
      code: "USER2000",
      message: "회원 탈퇴가 완료되었습니다.",
      result: response,
    });
  }),
];
