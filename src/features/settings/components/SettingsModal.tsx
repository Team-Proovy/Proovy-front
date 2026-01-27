import { useState, useEffect, useRef } from "react";
import { SettingsSidebar } from "./SettingsSidebar";
import { ProfileTabContent } from "./profile";
import { SubscriptionTabContent } from "./subscription";
import { CreditTabContent } from "./credit";
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
  const modalRef = useRef<HTMLDivElement | null>(null);
  useModalFocusTrap(modalRef, isOpen);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // 오버레이
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      {/* 모달 컨테이너 - 1100 x 640px 고정 */}
      <div
        ref={modalRef}
        className="relative flex h-[640px] w-[1100px] overflow-visible rounded-[20px] bg-white shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="settings-modal-title"
          className="sr-only"
        >
          설정
        </h2>
        {/* 왼쪽: 사이드바 */}
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* 오른쪽: 컨텐츠 영역 */}
        <div className="relative flex flex-1 flex-col p-[40px]">
          {/* 닫기 버튼 - 40px 패딩 영역에 맞춤 */}
          <button
            onClick={onClose}
            className="group absolute top-[40px] right-[40px] transition-colors"
          >
            <CloseIcon
              size={24}
              className="cursor-pointer text-black transition-colors duration-300 ease-out group-hover:[&_path]:fill-[#2A6AFF]"
            />
          </button>

          {/* 구분선 */}

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

// 포커스 트랩 훅: 모달이 열릴 때 첫 포커스로 이동하고 Tab 키로 포커스를 순환시킵니다.
function useModalFocusTrap(
  modalRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
) {
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(
      modal.querySelectorAll<HTMLElement>(focusableSelector),
    );
    const first = elements[0];
    const last = elements[elements.length - 1];

    if (first) first.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalRef, isOpen]);
}
