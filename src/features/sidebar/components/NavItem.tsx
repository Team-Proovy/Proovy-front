import React from "react";
import { NavLink } from "react-router-dom";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
}

export const NavItem = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
}: NavItemProps) => {
  return (
    <NavLink
      to={to}
      onClick={(e) => e.stopPropagation()}
      className={({ isActive }) => {
        // 사이드바가 펼쳐졌을 때 - active
        if (isActive) {
          if (isCollapsed) {
            return "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] bg-transparent py-2 pr-3 pl-[20px] text-[22px] font-bold text-[#2A6AFF] transition-all";
          }
          return "relative z-10 flex h-[48px] w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] border-[#E3E7ED] bg-[#FFFFFF] py-2 pr-3 pl-[20px] text-[22px] font-bold text-[black] drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out";
        }
        // 사이드바가 펼쳐졌을 때 - inactive
        return "mr-[14px] ml-2 flex h-[48px] w-[224px] cursor-pointer items-center gap-3 px-3 text-[18px] font-semibold text-[#2F3440] transition-all duration-300 ease-in-out";
      }}
    >
      {({ isActive }) => (
        <>
          <div className="flex shrink-0 items-center justify-center">
            <Icon
              size={36}
              color={
                isCollapsed ? "currentColor" : isActive ? "#2A6AFF" : "#6B7280"
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
      )}
    </NavLink>
  );
};
