/**
 * 요금제 타입 정의
 */
export type PlanType = "free" | "standard" | "pro";

export interface PlanInfo {
  type: PlanType;
  name: string;
  credits: number;
  storage: string;
  maxNotes: number;
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
  free: {
    type: "free",
    name: "Free",
    credits: 0,
    storage: "1GB",
    maxNotes: 2,
    price: 0,
  },
  standard: {
    type: "standard",
    name: "Standard",
    credits: 2000,
    storage: "5GB",
    maxNotes: 10,
    price: 6900,
  },
  pro: {
    type: "pro",
    name: "Pro",
    credits: 5000,
    storage: "10GB",
    maxNotes: 20,
    price: 14900,
  },
};

interface PlanInfoCardProps {
  plan: PlanInfo;
}

/**
 * PlanInfoCard - 요금제 정보 카드 컴포넌트
 *
 * 사용자의 현재 요금제 정보를 표시
 * - 요금제 이름, 기간, 가격
 * - 크레딧, 저장소, 노트 수 정보
 */
export const PlanInfoCard = ({ plan }: PlanInfoCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  return (
    <div className="relative h-[120px] w-full rounded-[12px] bg-[#F1F4F8] px-[28px] py-[20px]">
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
      <p className="mt-[12px] font-['Pretendard'] text-[16px] leading-[24px] font-medium text-black">
        <span className="font-medium">{formatPrice(plan.credits)}</span>
        <span> 크레딧 제공, 저장소 </span>
        <span className="font-medium">{plan.storage}</span>
        <span>, 생성 가능 노트 수 </span>
        <span className="font-medium">{plan.maxNotes}</span>
        <span>개</span>
      </p>
    </div>
  );
};
