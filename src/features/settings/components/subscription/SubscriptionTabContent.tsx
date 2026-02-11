import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/auth_store";
import { ConfirmModal } from "../ConfirmModal";
import {
  type PlanInfo,
  type PlanType,
  PLAN_DETAILS,
} from "../../../subscription/types/plan_types";
import { PlanInfoCard } from "./PlanInfoCard";
import { useMySubscription, useCancelSubscription } from "../../hooks/useUser";

/**
 * SubscriptionTabContent - 구독 정보 탭
 */
export const SubscriptionTabContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: subscription } = useMySubscription();
  const { mutateAsync: cancelSubscription } = useCancelSubscription();

  // 초기값 또는 로딩 중일 때 기본값 설정
  const userPlanName: PlanType = (user?.plan as PlanType) || "Free";
  const defaultPlanDetail = PLAN_DETAILS[userPlanName] || PLAN_DETAILS["Free"];

  const currentPlan: PlanInfo = subscription
    ? {
        type: subscription.currentPlan.name as PlanType,
        name: subscription.currentPlan.displayName,
        dailyCredits: subscription.benefits.dailyCredit,
        monthlyCredits: subscription.benefits.monthlyCredit,
        storage: String(subscription.benefits.storageLimit)
          .toUpperCase()
          .endsWith("GB")
          ? String(subscription.benefits.storageLimit)
          : `${subscription.benefits.storageLimit}GB`,
        maxNotes: subscription.benefits.maxNotes,
        maxUploadSize: String(subscription.benefits.maxFileSize)
          .toUpperCase()
          .endsWith("MB")
          ? String(subscription.benefits.maxFileSize)
          : `${subscription.benefits.maxFileSize}MB`,
        price: subscription.currentPlan.price,
        startDate: subscription.period?.startDate || "-",
        endDate: subscription.period?.endDate || "-",
      }
    : {
        ...defaultPlanDetail,
        startDate: "-",
        endDate: "-",
      };

  // 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReservedModalOpen, setIsReservedModalOpen] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [cancelInfo, setCancelInfo] = useState<{
    nextPlan: string;
    effectiveUntil: string;
  } | null>(null);

  const handleCancelClick = () => {
    // autoRenew가 false이면 이미 해지 예약 상태
    if (subscription && !subscription.billing.autoRenew) {
      setIsReservedModalOpen(true);
    } else {
      setIsCancelModalOpen(true);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await cancelSubscription();

      if (response.isSuccess) {
        setIsCancelModalOpen(false);
        // 취소 성공 정보 설정 (API 응답에 cancelInfo가 있다고 가정하거나 계산)
        // SubscriptionResponse에 cancelInfo가 포함되어 있는지 확인 필요.
        // response.result가 CancelSubscriptionResponse 타입이라면 cancelInfo가 있을 수 있음.
        // 여기서는 response.result를 any로 캐스팅하거나 타입을 확인해야 함.
        const result = response.result as any;
        const info = result?.cancelInfo || {
          nextPlan: "Free",
          effectiveUntil: subscription?.period.endDate || "-",
        };

        setCancelInfo(info);
        setShowCancelSuccessModal(true);
      } else {
        alert(response.message || "구독 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("Cancel failed:", error);
      alert("구독 취소 중 오류가 발생했습니다.");
    }
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

        {userPlanName !== "Free" && (
          <button
            onClick={handleCancelClick}
            className="duration-300ms flex h-[32px] w-[150px] cursor-pointer items-center justify-center rounded-[8px] bg-[rgba(220,53,69,0.10)] font-['Pretendard'] text-[16px] font-normal text-[#DC3545] transition-colors hover:bg-[rgba(220,53,69,0.20)]"
          >
            구독취소
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
        title="구독 취소"
        description={`${currentPlan.endDate}까지 ${currentPlan.name} 사용 가능합니다. 그 이후 ${"Free"} 플랜으로 변경됩니다. 정말 취소하시겠습니까?`}
        warningText=""
        confirmText="구독취소"
        variant="danger"
      />

      {/* 이미 해지 예약된 경우 표시되는 모달 */}
      {isReservedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReservedModalOpen(false);
          }}
        >
          <div className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg">
            <h2 className="mb-[10px] text-[20px] font-bold text-black">
              이미 해지가 예약되어 있습니다.
            </h2>
            <p className="mb-[20px] text-center text-[16px] text-[#5D6470]">
              {currentPlan.endDate}까지 {currentPlan.name} 사용 가능합니다.
            </p>
            <button
              onClick={() => setIsReservedModalOpen(false)}
              className="h-[48px] w-full rounded-[10px] bg-[#2A6AFF] text-white transition-colors hover:bg-[#1A50D1]"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {showCancelSuccessModal && cancelInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCancelSuccessModal(false);
          }}
        >
          <div className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg">
            <h2 className="mb-[20px] text-[20px] font-bold text-black">
              구독 취소가 완료되었습니다.
            </h2>
            <div className="mb-[20px] w-full rounded-[12px] bg-[#F1F4F8] p-[20px]">
              <div className="mb-[8px] flex justify-between">
                <span className="font-medium text-[#5D6470]">다음 플랜</span>
                <span className="font-bold text-black">
                  {cancelInfo.nextPlan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#5D6470]">변경 예정일</span>
                <span className="font-bold text-black">
                  {cancelInfo.effectiveUntil}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCancelSuccessModal(false);
                window.location.reload(); // 상태 갱신을 위해 리로드
              }}
              className="h-[48px] w-full rounded-[10px] bg-[#2A6AFF]/50 text-white transition-colors hover:bg-[#2A6AFF] active:bg-[#2A6AFF]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
