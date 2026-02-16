import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  message,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 text-center ${className}`}
    >
      {icon && <div className="mb-6">{icon}</div>}
      <h3 className="mb-2 font-['Pretendard'] text-[20px] font-semibold text-[#1A1A1A]">
        {message}
      </h3>
      {description && (
        <p className="mb-8 max-w-[400px] font-['Pretendard'] text-[15px] leading-[22px] font-medium text-[#9CA4B0]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex h-[44px] items-center justify-center rounded-[12px] bg-[#2A6AFF] px-[24px] font-['Pretendard'] text-[15px] font-semibold text-white transition-colors hover:bg-[#2A6AFF]/90 active:bg-[#2A6AFF]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
