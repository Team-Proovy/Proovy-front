import React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isActive = searchParams.get("search") === "true";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("search", "true");
        navigate(`${location.pathname}?${newSearchParams.toString()}`);
        onClick();
      }}
      className={
        isActive
          ? "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] bg-white py-2 pr-3 pl-[20px] text-[22px] font-bold text-[#2F3440] shadow-[0_4px_10px_2px_rgba(0,0,0,0.10)] transition-all duration-300 ease-in-out"
          : "mr-[14px] ml-2 flex h-[48px] w-[224px] cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[18px] font-semibold text-[#2F3440] transition-all duration-300 ease-in-out hover:bg-gray-50"
      }
    >
      <div className="flex shrink-0 items-center justify-center">
        <Icon
          size={36}
          color={isActive ? "#2A6AFF" : "#6B7280"}
        />
      </div>
      <span
        className={`overflow-hidden leading-[28px] tracking-[-0.01%] whitespace-nowrap transition-opacity duration-300 ease-in-out ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        {label}
      </span>
    </button>
  );
};
