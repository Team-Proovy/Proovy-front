import { useState } from "react";
import { SettingsSidebar } from "./SettingsSidebar";
import { CloseIcon } from "../../../shared/components/icons/SettingsIcons";
import type { SettingsTab } from "../types/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal - 설정 모달
 *
 * 사이드바 하단 설정 아이콘 클릭 시 열림
 * - 크기: 1100 x 640px 고정
 * - 위치: 화면 정중앙
 * - 탭: 내 프로필 / 구독 정보 / 크레딧 사용내역
 */
export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  if (!isOpen) return null;

  const handleLogout = () => {
    // TODO: 로그아웃 로직 구현
    console.log("로그아웃");
  };

  return (
    // 오버레이
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* 모달 컨테이너 - 1100 x 640px 고정 */}
      <div
        className="relative flex h-[640px] w-[1100px] overflow-visible rounded-[20px] bg-white shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 왼쪽: 사이드바 */}
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />

        {/* 오른쪽: 컨텐츠 영역 */}
        <div className="relative flex flex-1 flex-col p-[40px]">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="group absolute top-[24px] right-[24px] p-[8px] transition-colors"
          >
            <CloseIcon
              size={24}
              className="cursor-pointer text-black transition-colors duration-300 ease-out group-hover:[&_path]:fill-[#2A6AFF]"
            />
          </button>

          {/* 탭 컨텐츠 */}
          <SettingsContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
};

/**
 * 탭별 컨텐츠 렌더링
 */
const SettingsContent = ({ activeTab }: { activeTab: SettingsTab }) => {
  switch (activeTab) {
    case "profile":
      return <ProfileTabContent />;
    case "subscription":
      return <SubscriptionTabContent />;
    case "credit":
      return <CreditTabContent />;
  }
};

/**
 * 내 프로필 탭 (임시)
 */
const ProfileTabContent = () => {
  return (
    <div className="flex flex-col">
      <h3 className="mb-[24px] font-['Pretendard'] text-[20px] font-semibold text-black">
        내 프로필
      </h3>

      {/* TODO: 프로필 컨텐츠 구현 */}
      <div className="flex items-start gap-[40px]">
        {/* 프로필 이미지 영역 */}
        <div className="flex flex-col items-center gap-[12px]">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#FEE500]">
            {/* 카카오 아이콘 placeholder */}
            <span className="text-[40px]">💬</span>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex flex-1 flex-col gap-[20px]">
          <ProfileField
            label="이메일"
            value="user@example.com"
            readonly
          />
          <ProfileField
            label="이름"
            placeholder="이름을 입력하세요"
          />
          <ProfileField
            label="닉네임"
            placeholder="닉네임을 입력하세요"
          />
        </div>
      </div>

      {/* 회원 탈퇴 */}
      <div className="mt-auto border-t border-[#E5E5E5] pt-[24px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Pretendard'] text-[16px] font-medium text-black">
              회원 탈퇴
            </p>
            <p className="mt-[4px] font-['Pretendard'] text-[14px] text-[#6B7280]">
              Proovy에서 계정을 영구적으로 삭제합니다.
            </p>
          </div>
          <button className="font-['Pretendard'] text-[14px] font-medium text-[#2A6AFF] hover:underline">
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 구독 정보 탭 (임시)
 */
const SubscriptionTabContent = () => {
  return (
    <div className="flex flex-col">
      <h3 className="mb-[24px] font-['Pretendard'] text-[20px] font-semibold text-black">
        구독 정보
      </h3>

      {/* TODO: 구독 정보 컨텐츠 구현 */}
      <p className="text-[#6B7280]">구독 정보 탭 컨텐츠 (구현 예정)</p>
    </div>
  );
};

/**
 * 크레딧 사용내역 탭 (임시)
 */
const CreditTabContent = () => {
  return (
    <div className="flex flex-col">
      <h3 className="mb-[24px] font-['Pretendard'] text-[20px] font-semibold text-black">
        크레딧 사용내역
      </h3>

      {/* TODO: 크레딧 사용내역 컨텐츠 구현 */}
      <p className="text-[#6B7280]">크레딧 사용내역 탭 컨텐츠 (구현 예정)</p>
    </div>
  );
};

/**
 * 프로필 입력 필드
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
      <label className="font-['Pretendard'] text-[14px] text-[#6B7280]">
        {label}
      </label>
      {readonly ? (
        <p className="font-['Pretendard'] text-[16px] text-[#2F3440]">
          {value}
        </p>
      ) : (
        <input
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          className="w-full rounded-[8px] border border-[#D1D6DE] bg-[#F9FAFB] px-[16px] py-[12px] font-['Pretendard'] text-[16px] text-[#2F3440] transition-colors outline-none focus:border-[#2A6AFF]"
        />
      )}
    </div>
  );
};
