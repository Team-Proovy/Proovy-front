import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningText?: string;
  cancelText?: string;
  confirmText: string;
  variant?: "danger" | "primary";
}

/**
 * ConfirmModal - 확인/취소 모달
 *
 * 회원 탈퇴, 구독 취소 등 확인이 필요한 작업에 사용
 * - variant: "danger" (빨간색) | "primary" (파란색)
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  cancelText = "취소",
  confirmText,
  variant = "danger",
}: ConfirmModalProps) => {
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

  const confirmButtonStyle =
    variant === "danger"
      ? "bg-[#DC3545] hover:bg-[#c82333]"
      : "bg-[#2A6AFF] hover:bg-[#1a5ae8]";

  return (
    // 오버레이
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* 모달 컨테이너 */}
      <div
        className="flex h-[280px] w-[400px] flex-col rounded-[20px] bg-white p-[34px] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 제목 */}
        <h4 className="font-['Pretendard'] text-[20px] leading-[28px] font-bold text-black">
          {title}
        </h4>

        {/* 설명 */}
        <p className="mt-[12px] font-['Pretendard'] text-[18px] leading-[20px] font-semibold text-[#2F3440]">
          {description}
        </p>

        {/* 경고 텍스트 (옵션) */}
        {warningText && (
          <p className="mt-[24px] font-['Pretendard'] text-[14px] leading-[20px] text-[#DC3545]">
            {warningText}
          </p>
        )}

        {/* 버튼 영역 - 하단 고정 */}
        <div className="mt-auto flex gap-[12px]">
          {/* 취소 버튼 - 너비 200px */}
          <button
            onClick={onClose}
            className="flex h-[48px] w-[200px] items-center justify-center rounded-[12px] border border-[#D1D6DE] bg-[#F1F4F8] font-['Pretendard'] text-[18px] font-semibold text-[#6B7280] transition-colors hover:bg-[#E5E8EC]"
          >
            {cancelText}
          </button>

          {/* 확인 버튼 - 너비 120px */}
          <button
            onClick={onConfirm}
            className={`flex h-[48px] w-[120px] items-center justify-center rounded-[12px] font-['Pretendard'] text-[18px] font-semibold text-white transition-colors ${confirmButtonStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
