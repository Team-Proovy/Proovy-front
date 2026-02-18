import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProovyLogo } from "../../../shared/components/icons/ProovyLogo";
import { useAuthStore } from "../../auth/store/auth_store";
import {
  useUpgradeSubscription,
  useMySubscription,
} from "../../settings/hooks/useUser";
import { showErrorToast } from "@/shared/lib/toast";

import { type PlanType, normalizePlanType } from "../types/plan_types";

export const PricingPage = () => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fromHome = location.state?.from === "home";

  const plans: {
    name: PlanType;
    description: string;
    price: string;
    features: string[];
  }[] = [
    {
      name: "Free",
      description: "무료 사용자용 플랜",
      price: "0",
      features: [
        "하루 100 크레딧 제공",
        "월 총 ~3,000 크레딧",
        "모든 모델 사용 가능",
        "노트 개수 2개",
        "저장소 1GB",
        "단일 파일 크기 10MB",
      ],
    },
    {
      name: "Standard",
      description: "부담 없는 일상 사용에 적합한 플랜",
      price: "6,900",
      features: [
        "하루 100 크레딧 제공",
        "월 2,000 크레딧 제공",
        "월 총 ~5,000 크레딧",
        "모든 모델 사용 가능",
        "노트 개수 10개",
        "저장소 5GB",
        "단일 파일 크기 50MB",
      ],
    },
    {
      name: "Pro",
      description: "부족함 없는 사용에 적합한 플랜",
      price: "14,900",
      features: [
        "하루 100 크레딧 제공",
        "월 5,000 크레딧 제공",
        "월 총 ~8,000 크레딧",
        "모든 모델 사용 가능",
        "노트 개수 20개",
        "저장소 10GB",
        "단일 파일 크기 100MB",
      ],
    },
  ];

  const { user, updateUser } = useAuthStore();
  const { data: subscription } = useMySubscription();

  // 최신 구독 정보로 동기화
  useEffect(() => {
    if (subscription && user) {
      const serverPlan = normalizePlanType(subscription.currentPlan.name);
      if (user.plan !== serverPlan) {
        updateUser({ plan: serverPlan });
      }
    }
  }, [subscription, user, updateUser]);

  const [showUpgradeConfirmModal, setShowUpgradeConfirmModal] = useState(false);
  const [showUpgradeSuccessModal, setShowUpgradeSuccessModal] = useState(false);

  const [targetPlanForUpgrade, setTargetPlanForUpgrade] =
    useState<PlanType | null>(null);

  const planLevels: Record<string, number> = {
    Free: 0,
    Standard: 1,
    Pro: 2,
  };

  const handlePlanClick = (planName: PlanType) => {
    // 로그인 확인
    if (!user) {
      navigate("/login");
      return;
    }

    const currentLevel = planLevels[user?.plan || "Free"] || 0;
    const targetLevel = planLevels[planName] || 0;

    if (targetLevel > currentLevel) {
      // 업그레이드 -> 확인 모달 표시
      setTargetPlanForUpgrade(planName);
      setShowUpgradeConfirmModal(true);
    }
  };

  // useUpgradeSubscription 훅
  const { mutateAsync: upgrade } = useUpgradeSubscription();

  const confirmUpgrade = async () => {
    if (targetPlanForUpgrade) {
      try {
        const planType = targetPlanForUpgrade.toLowerCase() as
          | "standard"
          | "pro";

        const response = await upgrade({
          planType,
        });

        if (response.isSuccess) {
          updateUser({ plan: targetPlanForUpgrade });
          setShowUpgradeConfirmModal(false);
          setShowUpgradeSuccessModal(true);
        } else {
          showErrorToast(response.message || "업그레이드에 실패했습니다.");
        }
      } catch (error) {
        console.error("Upgrade failed:", error);
        showErrorToast("업그레이드 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center overflow-y-auto bg-white py-[20px]">
      <button
        onClick={() => {
          if (fromHome) {
            navigate("/app/home");
          } else {
            navigate("/");
          }
        }}
        className="absolute top-4 left-4 cursor-pointer font-['Pretendard'] text-[12px] leading-[normal] font-semibold text-black hover:opacity-70 md:top-[40px] md:left-[40px]"
      >
        {fromHome ? "← 돌아가기(홈)" : "← 돌아가기"}
      </button>

      <div className="mt-[40px] mb-[40px] flex flex-col items-center text-center md:mt-0">
        <div className="flex items-center justify-center">
          <ProovyLogo className="h-[40px] w-auto md:h-[58px]" />
          <span className="font-['Pretendard'] text-[30px] leading-[40px] font-bold tracking-[-0.01em] text-black md:text-[40px] md:leading-[58px]">
            의 요금 플랜
          </span>
        </div>
        <div className="mt-[20px] flex flex-col items-center gap-0">
          <p className="text-center font-['Pretendard'] text-[16px] leading-[24px] font-normal tracking-[-0.01em] whitespace-pre-wrap text-black md:text-[18px] md:leading-[28px]">
            프루비는 무료로 시작할 수 있습니다.{"\n"}당신의 필요에 가장 잘 맞는
            요금제를 선택하세요!
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-[20px] md:gap-[36px]">
        {plans.map((plan) => {
          const currentPlanName = user?.plan || "Free";
          const isCurrentPlan = !!user && currentPlanName === plan.name;
          const isHovered = hoveredPlan === plan.name;
          const currentLevel = planLevels[currentPlanName] || 0;
          const thisLevel = planLevels[plan.name] || 0;
          const isHighlighted = isCurrentPlan;

          const cardStyle = {
            border: isHighlighted ? "1px solid #2A6AFF" : "1px solid #D1D6DE",
            backgroundColor: isHighlighted ? "#F4F7FF" : "#FFFFFF",
            boxShadow:
              isHovered && !isHighlighted
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                : "none",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          };

          const buttonStyle = {
            backgroundColor: isHighlighted
              ? "#2A6AFF"
              : isHovered
                ? "rgba(42, 106, 255, 0.5)"
                : "#F1F4F8",
            color: isHighlighted || isHovered ? "#FFFFFF" : "#000000",
          };

          const checkColor = isHighlighted || isHovered ? "#2A6AFF" : "#D1D6DE";

          let buttonText = "시작하기";
          let isDisabled = false;

          if (user) {
            if (isCurrentPlan) {
              buttonText = "사용 중";
              isDisabled = true;
            } else {
              if (thisLevel > currentLevel) {
                buttonText = isHovered ? "업그레이드" : "시작하기";
              } else {
                buttonText = "사용 불가";
                isDisabled = true;
              }
            }
          }

          return (
            <div
              key={plan.name}
              onMouseEnter={() => setHoveredPlan(plan.name)}
              onMouseLeave={() => setHoveredPlan(null)}
              className="flex h-auto min-h-[400px] w-[320px] flex-col rounded-[20px] px-[20px] py-[30px] transition-all duration-300 select-none"
              style={cardStyle}
            >
              <div className="mb-[16px] flex flex-col gap-[8px]">
                <h3 className="font-['Pretendard'] text-[24px] leading-[32px] font-bold tracking-[-0.01em] text-black">
                  {plan.name}
                </h3>
                <p className="font-['Pretendard'] text-[18px] leading-[28px] font-medium tracking-[-0.01em] text-[#2F3440]">
                  {plan.description}
                </p>
              </div>

              <div className="mb-[16px] flex items-end gap-[4px]">
                <span className="font-['Pretendard'] text-[42px] leading-[48px] font-bold tracking-[-0.01em] text-black">
                  {plan.price}원
                </span>
                <span className="mb-[8px] font-['Pretendard'] text-[15px] leading-[20px] font-medium text-[#9CA4B0]">
                  /매월
                </span>
              </div>

              <button
                onClick={() => handlePlanClick(plan.name)}
                disabled={isDisabled}
                className={`mb-[24px] flex h-[52px] w-[280px] items-center justify-center rounded-[12px] p-[10px] text-[20px] leading-[28px] font-semibold transition-all duration-300 select-text ${isDisabled && !isCurrentPlan ? "cursor-default opacity-50" : isDisabled && isCurrentPlan ? "cursor-default" : "cursor-pointer"}`}
                style={
                  isDisabled && !isCurrentPlan
                    ? {
                        ...buttonStyle,
                        backgroundColor: "#E5E7EB",
                        color: "#9CA4B0",
                      }
                    : buttonStyle
                }
              >
                {buttonText}
              </button>

              <div className="flex flex-col gap-[12px]">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-[12px]"
                  >
                    <CheckIcon
                      color={checkColor}
                      className="transition-colors duration-300"
                    />
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

      {showUpgradeConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUpgradeConfirmModal(false);
          }}
        >
          <div className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg">
            <h2 className="mb-[20px] text-[20px] font-bold text-black">
              {targetPlanForUpgrade} 플랜으로 변경하시겠습니까?
            </h2>
            <div className="flex w-full gap-[12px]">
              <button
                onClick={() => setShowUpgradeConfirmModal(false)}
                className="h-[48px] flex-1 cursor-pointer rounded-[10px] bg-[#F1F4F8] text-[#5D6470] transition-colors hover:bg-[#E3E7ED]"
              >
                취소
              </button>
              <button
                onClick={confirmUpgrade}
                className="h-[48px] flex-1 cursor-pointer rounded-[10px] bg-[#2A6AFF]/50 text-white transition-colors hover:bg-[#2A6AFF] active:bg-[#2A6AFF]"
              >
                업그레이드
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUpgradeSuccessModal(false);
          }}
        >
          <div className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg">
            <h2 className="mb-[20px] text-[20px] font-bold text-black">
              업그레이드가 완료되었습니다.
            </h2>
            <button
              onClick={() => {
                setShowUpgradeSuccessModal(false);
              }}
              className="h-[48px] w-full cursor-pointer rounded-[10px] bg-[#2A6AFF]/50 text-white transition-colors hover:bg-[#2A6AFF] active:bg-[#2A6AFF]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon = ({
  className,
  color,
}: {
  className?: string;
  color?: string;
}) => (
  <svg
    width="11"
    height="8"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1 3.5L4 6.5L9.5 1"
      stroke={color || "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
