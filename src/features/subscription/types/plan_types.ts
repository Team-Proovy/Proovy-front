/**
 * 요금제 타입 정의
 */
export type PlanType = "Free" | "Standard" | "Pro";

export interface PlanInfo {
  type: PlanType;
  name: string;
  dailyCredits: number;
  monthlyCredits: number;
  storage: string;
  maxNotes: number;
  maxUploadSize: string;
  price: number;
  startDate: string;
  endDate: string;
}

/**
 * 요금제별 기본 정보
 */
export const PLAN_DETAILS: Record<
  PlanType,
  Omit<PlanInfo, "startDate" | "endDate">
> = {
  Free: {
    type: "Free",
    name: "Free",
    dailyCredits: 100,
    monthlyCredits: 0,
    storage: "5GB",
    maxNotes: 2,
    maxUploadSize: "10MB",
    price: 0,
  },
  Standard: {
    type: "Standard",
    name: "Standard",
    dailyCredits: 100,
    monthlyCredits: 5000,
    storage: "5GB",
    maxNotes: 10,
    maxUploadSize: "50MB",
    price: 0,
  },
  Pro: {
    type: "Pro",
    name: "Pro",
    dailyCredits: 100,
    monthlyCredits: 8000,
    storage: "10GB",
    maxNotes: 20,
    maxUploadSize: "100MB",
    price: 0,
  },
};
