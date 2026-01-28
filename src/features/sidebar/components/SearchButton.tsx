import React from "react";
// 페이지 이동이 아니라 함수 실행(onClick) 목적인 버튼이기에 따로 컴포넌트로 뺌

interface SearchButtonProps {
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  onClick: () => void;
}

export const SearchButton = ({
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: SearchButtonProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        isCollapsed
          ? "flex w-full cursor-pointer items-center justify-center py-0 text-[#2F3440] transition-all"
          : "mr-[14px] ml-2 flex w-[224px] cursor-pointer items-center gap-3 rounded-r-[12px] px-3 py-3 text-[#2F3440] transition-all"
      }
    >
      <div className="flex items-center justify-center">
        <Icon
          size={36}
          color="#6B7280"
        />
      </div>
      {!isCollapsed && (
        <span className="text-[18px] leading-[28px] font-semibold tracking-[-0.01%]">
          {label}
        </span>
      )}
    </button>
  );
};
