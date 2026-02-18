import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import type { ApiResponse } from "@/shared/api/shared_types";
import {
  LoginProviderIcon,
  type LoginProvider,
} from "../../../../shared/components/icons/LoginProviderIcons";

import { ProfileField } from "./ProfileField";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/auth_store";
import { deleteAccount } from "../../api/user_api";
import { useMyProfile, useMySubscription } from "../../hooks/useUser";
import { logout as logoutApi } from "../../../auth/api/auth_api";
import { showErrorToast } from "@/shared/lib/toast";

/**
 * ProfileTabContent - 내 프로필 탭
 */
export const ProfileTabContent = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const { data: profile } = useMyProfile();
  const { data: subscription } = useMySubscription();

  useEffect(() => {
    if (profile) {
      const { email, name, nickname, profileImageUrl, provider, subscription } =
        profile;

      // AuthStore 업데이트 (데이터가 변경된 경우에만 수행하도록 내부적으로 체크하거나,
      // store 구현에 따라 다름. 여기서는 매번 업데이트하지만 loop는 아님)
      // 단, infinite update loop를 방지하기 위해 JSON.stringify 등 비교가 필요할 수 있으나
      // useMyProfile의 data가 stable하다면 괜찮음.
      // 안전하게 user state와 비교
      // (참고: profile의 period.endDate 같은 정보는 user store에 없을 수 있으므로
      //  Warning Modal에는 profile.subscription.endDate 사용)
      if (
        user?.nickname !== nickname ||
        user?.profileImageUrl !== profileImageUrl ||
        user?.plan !== subscription.plan
      ) {
        updateUser({
          email,
          name,
          nickname,
          profileImageUrl,
          provider,
          plan: subscription.plan as "Free" | "Standard" | "Pro",
        });
      }
    }
  }, [profile, updateUser, user?.nickname, user?.profileImageUrl, user?.plan]);

  const loginProvider = user?.provider?.toLowerCase() as
    | LoginProvider
    | undefined;

  // 회원 탈퇴 모달 상태
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSubscriptionWarningModalOpen, setIsSubscriptionWarningModalOpen] =
    useState(false);
  const [isMustCancelModalOpen, setIsMustCancelModalOpen] = useState(false);
  const [isWithdrawErrorModalOpen, setIsWithdrawErrorModalOpen] =
    useState(false);
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState("");

  const executeWithdraw = async () => {
    try {
      const response = await deleteAccount();
      if (response.isSuccess) {
        logout();
        navigate("/login", { replace: true });
      } else {
        setWithdrawErrorMessage(
          response.message || "회원 탈퇴에 실패했습니다.",
        );
        setIsWithdrawErrorModalOpen(true);
      }
    } catch (error) {
      console.error("회원 탈퇴 에러:", error);
      // API 응답 에러 메시지 추출
      let message = "회원 탈퇴 중 오류가 발생했습니다.";

      if (error instanceof AxiosError) {
        const data = error.response?.data as ApiResponse<null>;
        if (data?.message) {
          message = data.message;
        }
      }

      setWithdrawErrorMessage(message);
      setIsWithdrawErrorModalOpen(true);
    } finally {
      setIsWithdrawModalOpen(false);
      setIsSubscriptionWarningModalOpen(false);
    }
  };

  const handleWithdrawClick = () => {
    // 1차: 기본 탈퇴 모달 표시
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawConfirm = () => {
    const currentPlan = profile?.subscription?.plan || user?.plan || "Free";

    if (currentPlan !== "Free") {
      if (subscription === undefined) {
        showErrorToast(
          "구독 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        );
        return;
      }

      if (subscription?.billing?.autoRenew) {
        setIsWithdrawModalOpen(false);
        setIsMustCancelModalOpen(true);
      } else {
        setIsWithdrawModalOpen(false);
        setIsSubscriptionWarningModalOpen(true);
      }
    } else {
      executeWithdraw();
    }
  };

  const handleLogout = async () => {
    try {
      // 서버 로그아웃 요청 (토큰 만료 처리 등)
      await logoutApi();
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
      // 서버 로그아웃 실패하더라도 클라이언트 로그아웃은 진행
    }
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        내 프로필
      </h3>

      <div className="mt-[12px] mb-[40px] h-[0.5px] bg-[#D1D6DE]" />

      <div className="flex items-start">
        <div className="mr-[50px] ml-[10px] flex flex-col items-center">
          {loginProvider ? (
            <LoginProviderIcon
              provider={loginProvider}
              size={100}
            />
          ) : (
            <div className="h-[100px] w-[100px] animate-pulse rounded-full bg-gray-200" />
          )}
          <button
            className="mt-[24px] h-[32px] w-[150px] cursor-pointer rounded-[8px] bg-[rgba(220,53,69,0.10)] font-['Pretendard'] text-[16px] leading-[24px] text-[#DC3545] transition-colors hover:bg-[rgba(220,53,69,0.20)]"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-[20px]">
          <ProfileField
            label="이메일"
            value={user?.email || ""}
            readonly
          />
          <ProfileField
            label="이름"
            value={user?.name || ""}
            readonly
          />
          <ProfileField
            label="닉네임"
            value={user?.nickname || ""}
            readonly
          />
        </div>
      </div>

      <div className="mt-[100px] mb-[24px] h-[0.5px] bg-[#D1D6DE]" />

      <div>
        <p className="font-['Pretendard'] text-[14px] font-medium text-black">
          회원 탈퇴
        </p>
        <div className="mt-[8px] flex items-center justify-between">
          <p className="font-['Pretendard'] text-[14px] text-[#9CA4B0]">
            Proovy에서 계정을 영구적으로 삭제합니다.
          </p>
          <button
            onClick={handleWithdrawClick}
            className="cursor-pointer font-['Pretendard'] text-[14px] font-bold text-[#DC3545] underline underline-offset-4"
          >
            탈퇴하기
          </button>
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 (Custom Design) */}
      {isWithdrawModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsWithdrawModalOpen(false)}
        >
          <div
            className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-[20px] font-['Pretendard'] text-[20px] font-bold text-black">
              회원 탈퇴
            </h2>
            <p className="mb-[10px] text-center font-['Pretendard'] text-[16px] leading-[24px] text-[#5D6470]">
              정말로 계정을 삭제하시겠습니까?
            </p>
            <p className="mb-[30px] text-center font-['Pretendard'] text-[14px] leading-[20px] text-[#DC3545]">
              계정을 삭제하시면 모든 데이터가 영구적으로 삭제되며
              <br />
              복구가 불가능합니다. 이 작업은 취소할 수 없습니다.
            </p>
            <div className="flex w-full gap-[10px]">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#F1F4F8] py-[14px] font-['Pretendard'] text-[16px] font-semibold text-[#6B7280] transition-colors hover:bg-[#E5E8EC]"
              >
                취소
              </button>
              <button
                onClick={handleWithdrawConfirm}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#DC3545] py-[14px] font-['Pretendard'] text-[16px] font-semibold text-white transition-colors hover:bg-[#C82333]"
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구독 잔여 기간 경고 모달 (Custom Design) */}
      {isSubscriptionWarningModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsSubscriptionWarningModalOpen(false)}
        >
          <div
            className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-[20px] font-['Pretendard'] text-[20px] font-bold text-black">
              회원 탈퇴
            </h2>
            <p className="mb-[10px] text-center font-['Pretendard'] text-[16px] leading-[24px] text-[#5D6470]">
              {profile?.subscription?.endDate || "이번 달"}까지 사용 가능한데
              <br />
              정말로 탈퇴하시겠습니까?
            </p>
            <p className="mb-[30px] text-center font-['Pretendard'] text-[14px] leading-[20px] text-[#DC3545]">
              남은 기간 동안의 서비스 이용 권한도 즉시 소멸됩니다.
            </p>
            <div className="flex w-full gap-[10px]">
              <button
                onClick={() => setIsSubscriptionWarningModalOpen(false)}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#F1F4F8] py-[14px] font-['Pretendard'] text-[16px] font-semibold text-[#6B7280] transition-colors hover:bg-[#E5E8EC]"
              >
                취소
              </button>
              <button
                onClick={executeWithdraw}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#DC3545] py-[14px] font-['Pretendard'] text-[16px] font-semibold text-white transition-colors hover:bg-[#C82333]"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구독 취소 필요 모달 (Custom Modal for single button & design) */}
      {isMustCancelModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMustCancelModalOpen(false);
          }}
        >
          <div className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg">
            <h2 className="mb-[10px] text-[20px] font-bold text-black">
              구독 취소 필요
            </h2>
            <p className="mb-[20px] text-center text-[16px] text-[#5D6470]">
              구독 중인 상품이 있습니다. 구독 취소 후 탈퇴가 가능합니다.
            </p>
            <button
              onClick={() => setIsMustCancelModalOpen(false)}
              className="h-[48px] w-full cursor-pointer rounded-[10px] bg-[#2A6AFF] text-white transition-colors hover:bg-[#1A50D1]"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 실패(구독 중 등) 에러 모달 */}
      {isWithdrawErrorModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget)
              setIsWithdrawErrorModalOpen(false);
          }}
        >
          <div className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg">
            <h2 className="mb-[20px] text-center text-[18px] font-bold whitespace-pre-wrap text-black">
              {withdrawErrorMessage}
            </h2>
            <button
              onClick={() => setIsWithdrawErrorModalOpen(false)}
              className="h-[48px] w-full cursor-pointer rounded-[10px] bg-[#2A6AFF] text-white transition-colors hover:bg-[#1A50D1]"
            >
              확인하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
