import React from "react";

interface SearchButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export const SearchButton = ({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  onClick,
}: SearchButtonProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`group ${
        isActive
          ? isCollapsed
            ? "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] bg-transparent py-2 pr-3 pl-[20px] text-[#2A6AFF] text-[22px] font-bold transition-all"
            : "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] border-[#E3E7ED] bg-[#FFFFFF] py-2 pr-3 pl-[20px] text-[22px] font-bold text-[black] drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out"
          : "mr-[14px] ml-2 flex h-[48px] w-[224px] cursor-pointer items-center gap-3 px-3 text-[18px] font-semibold text-[#2F3440] transition-all duration-300 ease-in-out hover:bg-gray-50"
      }`}
    >
      <div className="flex shrink-0 items-center justify-center">
        <Icon
          size={36}
          color={
            isCollapsed ? "currentColor" : isActive ? "#2A6AFF" : "#6B7280"
          }
        />
      </div>
      <span
        className={`overflow-hidden leading-[28px] tracking-[-0.01%] transition-opacity duration-300 ease-in-out ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        {label}
      </span>
    </button>
  );
};
