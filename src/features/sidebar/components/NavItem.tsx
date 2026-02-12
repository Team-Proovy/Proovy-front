import React from "react";
import { NavLink, useSearchParams } from "react-router-dom";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const NavItem = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: NavItemProps) => {
  const [searchParams] = useSearchParams();
  const isSearchOpen = searchParams.get("search") === "true";

  return (
    <NavLink
      to={to}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      className={({ isActive }) => {
        const active = isActive && !isSearchOpen;
        // 사이드바가 펼쳐졌을 때 - active
        if (active) {
          if (isCollapsed) {
            return "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] bg-transparent py-2 pr-3 pl-[20px] text-[22px] font-bold text-[#2A6AFF] transition-all";
          }
          return "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] border-[#E3E7ED] bg-[#FFFFFF] py-2 pr-3 pl-[20px] text-[22px] font-bold text-[black] drop-shadow-[4px_4px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out";
        }
        // 사이드바가 펼쳐졌을 때 - inactive
        return "mr-[14px] ml-2 flex h-[48px] w-[224px] cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[18px] font-semibold text-[#2F3440] transition-all duration-300 ease-in-out hover:bg-gray-50";
      }}
    >
      {({ isActive }) => {
        const active = isActive && !isSearchOpen;
        return (
          <>
            <div className="flex shrink-0 items-center justify-center">
              <Icon
                size={36}
                color={
                  isCollapsed ? "currentColor" : active ? "#2A6AFF" : "#6B7280"
                }
              />
            </div>
            <span
              className={`overflow-hidden leading-[28px] tracking-[-0.01%] whitespace-nowrap transition-opacity duration-300 ease-in-out ${
                isCollapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              {label}
            </span>
          </>
        );
      }}
    </NavLink>
  );
};
