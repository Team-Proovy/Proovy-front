// ============================================================
// 내 프로필 관련 타입
// ============================================================

/** 구독 정보 (간략) */
export interface SubscriptionDto {
  plan: string;
  startDate: string;
  endDate: string;
}

/** 일일 크레딧 정보 */
export interface DailyCreditDto {
  balance: number;
  limit: number;
  resetsAt: string;
}

/** 월간 크레딧 정보 */
export interface MonthlyCreditDto {
  balance: number;
  limit: number;
  expiresAt: string;
}

/** 크레딧 정보 */
export interface CreditDto {
  dailyCredit: DailyCreditDto;
  monthlyCredit: MonthlyCreditDto;
  totalAvailable: number;
}

/** 스토리지 정보 */
export interface StorageDto {
  used: number;
  limit: number;
  unit: string;
}

/** 내 프로필 응답 */
export interface MyProfileResponse {
  userId: number;
  email: string;
  name: string;
  nickname: string;
  department: string;
  profileImageUrl: string | null;
  provider: string;
  createdAt: string;
  subscription: SubscriptionDto;
  credit: CreditDto;
  storage: StorageDto;
}

// ============================================================
// 구독 정보 상세 타입
// ============================================================

/** 현재 요금제 정보 */
export interface CurrentPlanDto {
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingCycle: string;
}

/** 구독 기간 정보 */
export interface PeriodDto {
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

/** 요금제 혜택 정보 */
export interface BenefitsDto {
  dailyCredit: number;
  monthlyCredit: number;
  maxMonthlyCredit: number;
  storageLimit: string;
  maxFileSize: string;
  maxNotes: number;
}

/** 결제 정보 */
export interface BillingDto {
  nextBillingDate: string;
  autoRenew: boolean;
}

/** 이용 가능한 요금제 */
export interface AvailablePlanDto {
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingCycle: string;
  benefits: BenefitsDto;
}

/** 구독 정보 상세 응답 */
export interface SubscriptionResponse {
  currentPlan: CurrentPlanDto;
  period: PeriodDto;
  benefits: BenefitsDto;
  billing: BillingDto;
  availablePlans: AvailablePlanDto[];
}

/** 회원 탈퇴 응답 */
export interface DeleteUserResponse {
  deletedAt: string;
}
