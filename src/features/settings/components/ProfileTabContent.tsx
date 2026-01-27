import { useState } from "react";
import {
  LoginProviderIcon,
  type LoginProvider,
} from "../../../shared/components/icons/LoginProviderIcons";
import { ConfirmModal } from "./ConfirmModal";

/**
 * ProfileTabContent - 내 프로필 탭
 */
export const ProfileTabContent = () => {
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
            className="mt-[24px] h-[32px] w-[150px] rounded-[8px] bg-[rgba(220,53,69,0.10)] font-['Pretendard'] text-[16px] leading-[24px] text-[#DC3545] transition-colors hover:bg-[rgba(220,53,69,0.20)]"
            onClick={() => {
              // TODO: 로그아웃 로직 구현
              console.log("로그아웃");
            }}
          >
            로그아웃
          </button>
        </div>

        {/* 프로필 정보 */}
        <div className="flex flex-1 flex-col gap-[20px]">
          <ProfileField
            label="이메일"
            value="9hyung@gmail.com"
            readonly
          />
          <ProfileField
            label="이름"
            value="안녕하세요 구현지입니다."
            placeholder="이름을 입력하세요"
          />
          <ProfileField
            label="닉네임"
            value="두바이쫀득치킨"
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

/**
 * 프로필 입력 필드
 * - 레이블과 입력 칸 사이: 8px
 * - 필드 간 간격: 20px (부모에서 gap-[20px] 적용)
 */
const ProfileField = ({
  label,
  value,
  placeholder,
  readonly = false,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  readonly?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-[8px]">
      {/* 레이블: Pretendard Medium, 14px, line-height 20px */}
      <label className="font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black">
        {label}
      </label>
      {/* 입력 칸: 배경 #F1F4F8, border-radius 8px */}
      {readonly ? (
        <div className="w-full rounded-[8px] bg-[#F1F4F8] px-[16px] py-[12px] font-['Pretendard'] text-[16px] text-[#2F3440]">
          {value}
        </div>
      ) : (
        <input
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          className="w-full rounded-[8px] bg-[#F1F4F8] px-[16px] py-[12px] font-['Pretendard'] text-[16px] text-[#2F3440] transition-colors outline-none placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-[#2A6AFF]"
        />
      )}
    </div>
  );
};
