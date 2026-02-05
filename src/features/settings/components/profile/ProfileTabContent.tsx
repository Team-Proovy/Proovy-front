import { useState } from "react";
import {
  LoginProviderIcon,
  type LoginProvider,
} from "../../../../shared/components/icons/LoginProviderIcons";
import { ConfirmModal } from "../ConfirmModal";
import { ProfileField } from "./ProfileField";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/auth_store";
import { logout as logoutApi } from "../../../auth/api/auth_api";

/**
 * ProfileTabContent - 내 프로필 탭
 */
export const ProfileTabContent = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // TODO: API 연결 후 실제 로그인 제공자 정보 가져오기
  // 예: const { user } = useAuth();
  // const loginProvider = user?.provider || "kakao";
  const loginProvider: LoginProvider = "kakao"; // 기본값: 카카오

  // 회원 탈퇴 모달 상태
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const handleWithdraw = () => {
    // TODO: 회원 탈퇴 API 호출
    console.log("회원 탈퇴 처리");
    setIsWithdrawModalOpen(false);
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

      {/* 구분선 */}
      <div className="mt-[12px] mb-[40px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 프로필 컨텐츠 */}
      <div className="flex items-start">
        {/* 프로필 이미지 영역 - 로그인 제공자 아이콘 + 로그아웃 버튼 */}
        <div className="mr-[50px] ml-[10px] flex flex-col items-center">
          <LoginProviderIcon
            provider={loginProvider}
            size={100}
          />
          {/* 로그아웃 버튼 - 아이콘 아래 24px, 중앙 정렬, 130x32 */}
          <button
            className="mt-[24px] h-[32px] w-[150px] cursor-pointer rounded-[8px] bg-[rgba(220,53,69,0.10)] font-['Pretendard'] text-[16px] leading-[24px] text-[#DC3545] transition-colors hover:bg-[rgba(220,53,69,0.20)]"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>

        {/* 프로필 정보 */}
        <div className="flex flex-1 flex-col gap-[20px]">
          <ProfileField
            label="이메일"
            value={user?.email || ""}
            readonly
          />
          <ProfileField
            label="이름"
            value={user?.name || ""}
            placeholder="이름을 입력하세요"
          />
          <ProfileField
            label="닉네임"
            value={user?.nickname || ""}
            placeholder="닉네임을 입력하세요"
          />
        </div>
      </div>

      {/* 구분선 */}
      <div className="mt-[100px] mb-[24px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 회원 탈퇴 */}
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

      {/* 회원 탈퇴 확인 모달 */}
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
    </div>
  );
};
