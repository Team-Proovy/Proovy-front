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
        if (isCollapsed) {
          return `flex w-full cursor-pointer items-center justify-center py-0 transition-all ${
            isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
          }`;
        }
        if (isActive) {
          return "relative z-10 flex w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] bg-[#FFFFFF] py-2 pr-3 pl-[22px] text-[#000000] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all";
        }
        return "mr-[14px] ml-2 flex w-[224px] cursor-pointer items-center gap-3 rounded-r-[12px] px-3 py-3 text-[#333333] transition-all hover:bg-gray-50";
      }}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center justify-center">
            <Icon
              size={36}
              color={isActive ? "#2A6AFF" : "#666666"}
            />
          </div>
          {!isCollapsed && (
            <span
              className={`${isActive ? "text-[22px]" : "text-[18px]"} leading-[28px] font-semibold tracking-[-0.01%]`}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
