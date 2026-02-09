import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/auth_store";
import { ConfirmModal } from "../ConfirmModal";
import {
  PlanInfoCard,
  PLAN_DETAILS,
  type PlanInfo,
  type PlanType,
} from "./PlanInfoCard";

/**
 * SubscriptionTabContent - 구독 정보 탭
 */
export const SubscriptionTabContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const userPlanName: PlanType = (user?.plan as PlanType) || "Free";
  const planDetail = PLAN_DETAILS[userPlanName] || PLAN_DETAILS["Free"];

  const currentPlan: PlanInfo = {
    ...planDetail,
    // TODO: 결제 데이터 연동 시 실제 날짜로 변경
    startDate: "2026. 1. 10.",
    endDate: "2026. 2. 9.",
  };

  // 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCancelSubscription = () => {
    // TODO: 구독 취소 API 호출
    console.log("구독 취소 처리");
    setIsCancelModalOpen(false);
  };

  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        구독 정보
      </h3>
      {/* 구분선 */}
      <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 요금제 정보 카드 */}
      <PlanInfoCard plan={currentPlan} />

      {/* 버튼 영역 */}
      <div className="mt-[28px] flex gap-[16px]">
        {/* 업그레이드 버튼 - hover/active 시 파란색 배경 + 흰색 텍스트 */}
        <button
          onClick={() => navigate("/pricing")}
          className="duration-300ms flex h-[32px] w-[150px] cursor-pointer items-center justify-center rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[16px] text-black transition-colors hover:border-transparent hover:bg-[#2A6AFF]/20 hover:text-white active:bg-[#2A6AFF] active:text-white"
        >
          업그레이드
        </button>

        {/* 구독취소 버튼 */}
        <button
          onClick={() => setIsCancelModalOpen(true)}
          className="duration-300ms flex h-[32px] w-[150px] cursor-pointer items-center justify-center rounded-[8px] bg-[rgba(220,53,69,0.10)] font-['Pretendard'] text-[16px] font-normal text-[#DC3545] transition-colors hover:bg-[rgba(220,53,69,0.20)]"
        >
          구독취소
        </button>
      </div>

      {/* 구독 취소 확인 모달 */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
        title="구독 취소"
        description="정말로 구독을 취소하시겠습니까?"
        warningText="구독을 취소하면 다음 정기 결제일부터 요금이 청구되지 않습니다. 현재 보유하신 크레딧은 다음 구독 갱신일까지 계속 사용하실 수 있습니다."
        confirmText="구독취소"
        variant="danger"
      />
    </div>
  );
};
