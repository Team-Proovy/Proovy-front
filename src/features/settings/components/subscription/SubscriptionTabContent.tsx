import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/auth_store";
import { ConfirmModal } from "../ConfirmModal";
import {
  type PlanInfo,
  type PlanType,
  PLAN_DETAILS,
} from "../../../subscription/types/plan_types";
import { PlanInfoCard } from "./PlanInfoCard";
import { getMySubscription } from "../../api/user_api";

/**
 * SubscriptionTabContent - 구독 정보 탭
 */
export const SubscriptionTabContent = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await getMySubscription();
        if (response.isSuccess && response.result) {
          const { currentPlan, period, benefits } = response.result;
          const mappedPlan: PlanInfo = {
            type: currentPlan.name as PlanType,
            name: currentPlan.displayName,
            dailyCredits: benefits.dailyCredit,
            monthlyCredits: benefits.monthlyCredit,
            storage: benefits.storageLimit,
            maxNotes: benefits.maxNotes,
            maxUploadSize: benefits.maxFileSize,
            price: currentPlan.price,
            startDate: period.startDate,
            endDate: period.endDate,
          };
          setPlanInfo(mappedPlan);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
    };

    fetchSubscription();
  }, []);

  // 초기값 또는 로딩 중일 때 기본값 사용 (사용자 플랜 기반)
  const userPlanName: PlanType = (user?.plan as PlanType) || "Free";
  const defaultPlanDetail = PLAN_DETAILS[userPlanName] || PLAN_DETAILS["Free"];

  const currentPlan: PlanInfo = planInfo || {
    ...defaultPlanDetail,
    // API 로딩 전 임시 날짜
    startDate: "-",
    endDate: "-",
  };

  // 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleCancelSubscription = () => {
    // TODO: 실제 API 연동 시에는 백엔드에 구독 취소 요청을 보내야 합니다.
    // 현재는 프론트엔드 상태만 'Free'로 변경합니다.
    updateUser({ plan: "Free" });
    setIsCancelModalOpen(false);
  };

  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        구독 정보
      </h3>
      <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

      <PlanInfoCard plan={currentPlan} />

      <div className="mt-[28px] flex gap-[16px]">
        <button
          onClick={() => navigate("/pricing")}
          className="duration-300ms flex h-[32px] w-[150px] cursor-pointer items-center justify-center rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[16px] text-black transition-colors hover:border-transparent hover:bg-[#2A6AFF]/20 hover:text-white active:bg-[#2A6AFF] active:text-white"
        >
          업그레이드
        </button>

        <button
          onClick={() => setIsCancelModalOpen(true)}
          className="duration-300ms flex h-[32px] w-[150px] cursor-pointer items-center justify-center rounded-[8px] bg-[rgba(220,53,69,0.10)] font-['Pretendard'] text-[16px] font-normal text-[#DC3545] transition-colors hover:bg-[rgba(220,53,69,0.20)]"
        >
          구독취소
        </button>
      </div>

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
