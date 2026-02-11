import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import type { ApiResponse } from "@/shared/api/shared_types";
import {
  LoginProviderIcon,
  type LoginProvider,
} from "../../../../shared/components/icons/LoginProviderIcons";
import { ConfirmModal } from "../ConfirmModal";
import { ProfileField } from "./ProfileField";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/auth_store";
import { deleteAccount } from "../../api/user_api";
import { useMyProfile } from "../../hooks/useUser";
import { logout as logoutApi } from "../../../auth/api/auth_api";

/**
 * ProfileTabContent - 내 프로필 탭
 */
export const ProfileTabContent = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const { data: profile } = useMyProfile();

  useEffect(() => {
    if (profile) {
      const { email, name, nickname, profileImageUrl, provider, subscription } =
        profile;

      // AuthStore 업데이트 (데이터가 변경된 경우에만 수행하도록 내부적으로 체크하거나,
      // store 구현에 따라 다름. 여기서는 매번 업데이트하지만 loop는 아님)
      // 단, infinite update loop를 방지하기 위해 JSON.stringify 등 비교가 필요할 수 있으나
      // useMyProfile의 data가 stable하다면 괜찮음.
      // 안전하게 user state와 비교
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
  const [isWithdrawErrorModalOpen, setIsWithdrawErrorModalOpen] =
    useState(false);
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState("");

  const handleWithdraw = async () => {
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
            onClick={() => setIsWithdrawModalOpen(true)}
            className="cursor-pointer font-['Pretendard'] text-[14px] font-bold text-[#DC3545] underline underline-offset-4"
          >
            탈퇴하기
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onConfirm={handleWithdraw}
        title="회원 탈퇴"
        description="정말로 계정을 삭제하시겠습니까?"
        warningText="계정을 삭제하시면 모든 데이터가 영구적으로 삭제되며 복구가 불가능합니다. 이 작업은 취소할 수 없습니다."
        confirmText="회원탈퇴"
        variant="danger"
      />

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
              className="h-[48px] w-full rounded-[10px] bg-[#2A6AFF] text-white transition-colors hover:bg-[#1A50D1]"
            >
              확인하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
