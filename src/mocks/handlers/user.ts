import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  MyProfileResponse,
  SubscriptionResponse,
} from "@/features/settings/api/user_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const mockProfile: MyProfileResponse = {
  userId: 1,
  email: "mock.user@proovy.ai.kr",
  name: "Mock User",
  nickname: "MockUser",
  department: "Product",
  profileImageUrl: null,
  provider: "MOCK",
  createdAt: new Date().toISOString(),
  subscription: {
    plan: "Standard",
    startDate: "2026-02-01",
    endDate: "2026-03-01",
  },
  credit: {
    dailyCredit: {
      balance: 100,
      limit: 100,
      resetsAt: new Date(Date.now() + 86400000).toISOString(),
    },
    monthlyCredit: {
      balance: 1000,
      limit: 1000,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
    totalAvailable: 1100,
  },
  storage: {
    used: 2,
    limit: 20,
    unit: "GB",
  },
};

const mockSubscription: SubscriptionResponse = {
  currentPlan: {
    name: "Standard",
    displayName: "Standard",
    price: 9900,
    currency: "KRW",
    billingCycle: "MONTHLY",
  },
  period: {
    startDate: "2026-02-01",
    endDate: "2026-03-01",
    daysRemaining: 17,
  },
  benefits: {
    dailyCredit: 100,
    monthlyCredit: 1000,
    maxMonthlyCredit: 1000,
    storageLimit: 20,
    maxFileSize: 200,
    maxNotes: 20,
  },
  billing: {
    nextBillingDate: "2026-03-01",
    autoRenew: true,
  },
  availablePlans: [],
};

export const userHandlers = [
  http.get(`${BASE_URL}/api/users/me`, async () => {
    await delay(200);
    return HttpResponse.json<ApiResponse<MyProfileResponse>>({
      isSuccess: true,
      code: "COMMON200",
      message: "성공",
      result: mockProfile,
    });
  }),
  http.get(`${BASE_URL}/api/users/me/subscription`, async () => {
    await delay(200);
    return HttpResponse.json<ApiResponse<SubscriptionResponse>>({
      isSuccess: true,
      code: "COMMON200",
      message: "성공",
      result: mockSubscription,
    });
  }),
];
