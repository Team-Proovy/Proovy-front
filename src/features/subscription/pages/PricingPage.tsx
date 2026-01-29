import { useState } from "react";
import { ProovyLogo } from "../../../shared/components/ProovyLogo";

export const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "Free",
      description: "무료 사용자용 플랜",
      price: "0",
      features: [
        "하루 100 크레딧 제공",
        "월 0 크레딧 제공",
        "노트 개수 2개",
        "저장소 5GB",
        "업로드당 10MB",
      ],
    },
    {
      name: "Standard",
      description: "부담 없는 일상 사용에 적합한 플랜",
      price: "0",
      features: [
        "하루 100 크레딧 제공",
        "월 5000 크레딧 제공",
        "노트 개수 10개",
        "저장소 5GB",
        "업로드당 50MB",
      ],
    },
    {
      name: "Pro",
      description: "부족함 없는 사용에 적합한 플랜",
      price: "0",
      features: [
        "하루 100 크레딧 제공",
        "월 8000 크레딧 제공",
        "노트 개수 20개",
        "저장소 10GB",
        "업로드당 100MB",
      ],
    },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto bg-white pt-[155px] pb-[100px]">
      {/* Header Area */}
      {/* Group 237 position relative to 1440 width */}
      <div className="mb-[80px] flex flex-col items-center text-center">
        {/* Logo & Headline Row */}
        <div className="flex items-center justify-center">
          <ProovyLogo className="h-[58px] w-auto" />
          <span className="font-['Pretendard'] text-[40px] leading-[58px] font-bold tracking-[-0.01em] text-black">
            의 요금 플랜
          </span>
        </div>
        {/* Subtitle */}
        <div className="mt-[20px] flex flex-col items-center gap-0">
          <p className="text-center font-['Pretendard'] text-[18px] leading-[28px] font-normal tracking-[-0.01em] whitespace-pre-wrap text-black">
            프루비는 무료로 시작할 수 있습니다.{"\n"}당신의 필요에 가장 잘 맞는
            요금제를 선택하세요!
          </p>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="flex justify-center gap-[36px]">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.name;

          return (
            <div
              key={plan.name}
              onMouseLeave={() => setSelectedPlan(null)}
              className="group/card flex h-[500px] w-[320px] flex-col rounded-[20px] border border-[#D1D6DE] bg-white px-[20px] py-[49px] transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {/* Title & Desc */}
              <div className="mb-[24px] flex flex-col gap-[8px]">
                <h3 className="font-['Pretendard'] text-[24px] leading-[32px] font-bold tracking-[-0.01em] text-black">
                  {plan.name}
                </h3>
                <p className="font-['Pretendard'] text-[18px] leading-[28px] font-normal tracking-[-0.01em] text-[#2F3440]">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-[24px] flex items-end gap-[4px]">
                <span className="font-['Pretendard'] text-[40px] leading-[48px] font-bold tracking-[-0.01em] text-black">
                  {plan.price}원
                </span>
                <span className="mb-[6px] font-['Pretendard'] text-[14px] leading-[20px] font-normal text-[#6B7280]">
                  /매월
                </span>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setSelectedPlan(plan.name)}
                className={`mb-[32px] flex cursor-pointer items-center justify-center font-['Pretendard'] text-[20px] leading-[28px] font-semibold transition-all duration-300 ${
                  isSelected
                    ? "bg-[#2A6AFF] text-white"
                    : "bg-[#F1F4F8] text-black group-hover/card:bg-[#2A6AFF80] group-hover/card:text-white"
                } `}
                style={{
                  width: "280px",
                  height: "52px",
                  padding: "10px",
                  borderRadius: "12px",
                }}
              >
                {isSelected ? "업그레이드" : "시작하기"}
              </button>

              {/* Features List */}
              <div className="flex flex-col gap-[16px]">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-[12px]"
                  >
                    <CheckIcon className="transition-colors duration-300 group-hover/card:stroke-[#2A6AFF]" />
                    <span className="font-['Pretendard'] text-[14px] leading-[20px] font-normal text-[#2F3440]">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    width="11"
    height="8"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 3.5L4 6.5L9.5 1"
      stroke="#D1D6DE"
      className={`text-[#D1D6DE] ${className}`}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
