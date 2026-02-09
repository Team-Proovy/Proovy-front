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

interface PlanInfoCardProps {
  plan: PlanInfo;
}

/**
 * PlanInfoCard - 요금제 정보 카드 컴포넌트
 */
export const PlanInfoCard = ({ plan }: PlanInfoCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  return (
    <div className="relative flex w-full flex-col justify-between rounded-[12px] bg-[#F1F4F8] px-[28px] py-[20px]">
      {/* 상단 영역: 요금제 정보 + 기간 */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.002px] text-black">
            요금제 정보
          </h4>
          <p className="font-['Pretendard'] text-[14px] leading-[20px] font-medium text-[#2F3440]">
            {plan.name}
          </p>
        </div>
        <div className="text-right">
          <p className="font-['Pretendard'] text-[14px] leading-[24px] text-black">
            {plan.startDate} - {plan.endDate}
          </p>
          <p className="font-['Pretendard'] text-[16px] leading-[24px] font-medium text-black">
            {formatPrice(plan.price)}원 / 월
          </p>
        </div>
      </div>

      {/* 하단 영역: 상세 정보 */}
      <div className="mt-[12px] flex flex-col gap-[2px] font-['Pretendard'] text-[14px] leading-[20px] font-medium text-[#2F3440]">
        <p>
          하루 {formatPrice(plan.dailyCredits)} 크레딧 / 월{" "}
          {formatPrice(plan.monthlyCredits)} 크레딧 제공
        </p>
        <p>
          노트 {plan.maxNotes}개, 저장소 {plan.storage}, 업로드{" "}
          {plan.maxUploadSize}
        </p>
      </div>
    </div>
  );
};
