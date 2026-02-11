// ============================================================
// 크레딧 관련 타입
// ============================================================

/** 크레딧 변동 유형 */
export type CreditChangeType = "EARN" | "SPEND" | "EXPIRE";

/** 크레딧 유형 */
export type CreditType = "DAILY" | "FREE" | "PAID";

/** 크레딧 이벤트 유형 */
export type CreditEventType =
  | "DAILY_RESET"
  | "MONTHLY_GRANT"
  | "MONTHLY_EXPIRE"
  | "SIGNUP_BONUS"
  | "LLM_QUERY"
  | "OCR"
  | "CODE_EXECUTION";

/** 일일 무료 크레딧 정보 */
export interface DailyFreeCreditDto {
  balance: number;
  limit: number;
  expiresAt: string;
}

/** 무료 크레딧 정보 */
export interface FreeCreditDto {
  balance: number;
}

/** 유료 크레딧 정보 */
export interface PaidCreditDto {
  balance: number;
  expiresAt?: string;
}

/** 크레딧 상태 요약 */
export interface CreditSummaryDto {
  dailyFreeCredit: DailyFreeCreditDto;
  freeCredit: FreeCreditDto;
  paidCredit: PaidCreditDto;
  totalAvailable: number;
}

/** 크레딧 사용 내역 아이템 */
export interface CreditHistoryItemDto {
  historyId: number;
  eventType: CreditEventType;
  eventName: string;
  description: string;
  amount: number;
  changeType: CreditChangeType;
  creditType: CreditType;
  balanceAfter: {
    daily: number;
    free: number;
    paid: number;
  };
  createdAt: string;
}

/** 페이지네이션 정보 */
export interface PageInfoDto {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/** 크레딧 사용 내역 목록 */
export interface CreditHistoryListDto {
  content: CreditHistoryItemDto[];
  pageInfo: PageInfoDto;
}

/** 기간별 요약 정보 */
export interface PeriodSummaryDto {
  totalEarned: number;
  totalSpent: number;
  totalExpired: number;
  periodStart: string;
  periodEnd: string;
}

/** 크레딧 히스토리 조회 결과 */
export interface CreditHistoryResultDto {
  creditSummary: CreditSummaryDto;
  history: CreditHistoryListDto;
  periodSummary: PeriodSummaryDto;
}

/** 크레딧 히스토리 조회 파라미터 */
export interface GetCreditHistoryParams {
  page?: number;
  size?: number;
  changeType?: "all" | "earn" | "spend" | "expire";
  creditType?: "all" | "daily" | "free" | "paid";
  startDate?: string;
  endDate?: string;
}
