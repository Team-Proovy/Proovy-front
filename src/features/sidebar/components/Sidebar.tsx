import React from "react";
import { NavLink } from "react-router-dom";

// Shared
import { ProovyLogo } from "../../../shared/components/ProovyLogo";
import {
  BarArrowIcon,
  PaperIcon,
  HomeIcon,
  NoteIcon,
  RepositoryIcon,
  SlideIcon,
  UserIcon,
  SearchIcon,
  SettingIcon,
  CreditIcon,
} from "../../../shared/components/icons/SidebarIcons";

// Sidebar Components
import { SidebarIconButton } from "./SidebarIconButton";
import { RecentNotes } from "./RecentNotes";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onUpgradeClick: () => void;
}

export const Sidebar = ({
  isCollapsed,
  onToggle,
  onSearchClick,
  onSettingsClick,
  onUpgradeClick,
}: SidebarProps) => {
  return (
    // 외부 wrapper: 레이아웃에서 차지하는 공간 (240px or 80px)
    <div
      className={`relative z-10 h-full shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-[80px]" : "w-[240px]"
      }`}
    >
      {/* 실제 사이드바 - 튀어나온 부분(12px) 포함 */}
      <aside
        onClick={() => {
          if (isCollapsed) onToggle(false);
        }}
        className={`relative flex h-full flex-col transition-all duration-300 ${
          isCollapsed ? "w-[80px] cursor-pointer" : "w-[252px]"
        }`}
      >
        {/* 배경 레이어 - 240px만 (배경색 + shadow로 경계선 표현) */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-0 rounded-r-[12px] bg-white transition-all duration-300 ${
            isCollapsed
              ? "w-[80px] border-[0.5px] border-[#C6C6C6]"
              : "w-[240px] shadow-[1px_0_0_0_#C6C6C6]"
          }`}
        />

        {/* 컨텐츠 레이어 */}
        <div className="relative z-10 flex h-full flex-col">
          {/* 1. 로고 및 접기 버튼 (고정) */}
          <div
            className={`relative flex shrink-0 flex-col pt-[41px] ${
              isCollapsed ? "mb-8 items-center" : ""
            }`}
          >
            {!isCollapsed ? (
              <div className="mb-6 flex w-[240px] items-center justify-between pr-2 pl-3">
                <ProovyLogo className="h-[40px] w-[140px] text-gray-900" />
                <button
                  onClick={() => onToggle(true)}
                  className="group rounded p-1 transition-colors"
                >
                  <BarArrowIcon
                    className="mr-2 text-[#666] transition-colors duration-500 group-hover:text-[#2A6AFF]"
                    size={26}
                  />
                </button>
              </div>
            ) : (
              <SidebarIconButton
                ariaLabel="sidebar toggle"
                size="36"
                onClick={() => onToggle(false)}
              >
                <SlideIcon
                  color="#666"
                  size={40}
                />
              </SidebarIconButton>
            )}
          </div>

          {/* 2. 스크롤 가능 영역 (메인 메뉴 + 최근 노트) */}
          <div
            className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isCollapsed ? "w-[80px]" : "w-[270px]"
            }`}
          >
            {/* 메인 메뉴 */}
            <nav
              className={`${
                isCollapsed
                  ? "mb-8 flex flex-col gap-[24px]"
                  : "mb-4 flex flex-col gap-[2px] py-3 font-normal"
              }`}
            >
              <NavItem
                to="/app/home"
                icon={HomeIcon}
                label="홈"
                isCollapsed={isCollapsed}
              />
              <SearchButton
                icon={SearchIcon}
                label="검색"
                isCollapsed={isCollapsed}
                onClick={onSearchClick}
              />
              <NavItem
                to="/app/notes"
                icon={NoteIcon}
                label="노트목록"
                isCollapsed={isCollapsed}
              />
              <NavItem
                to="/app/storage"
                icon={RepositoryIcon}
                label="저장소"
                isCollapsed={isCollapsed}
              />
            </nav>

            {/* 최근 노트 목록 */}
            <div className={isCollapsed ? "w-[80px]" : "w-[240px]"}>
              <RecentNotes isCollapsed={isCollapsed} />
            </div>
          </div>

          {/* 3. 하단 유저 및 상태 정보 (고정) */}
          {!isCollapsed ? (
            <div className="w-[240px] shrink-0 space-y-4 border-t border-gray-100 px-[20px] pt-4 pb-[20px]">
              <div className="space-y-4 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#2A6AFF]" />
                    <span className="text-[14px] leading-[20px] font-medium text-[#333333]">
                      Free
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpgradeClick();
                    }}
                    className="flex h-[24px] w-[88px] items-center justify-center rounded bg-[#2A6AFF] text-[14px] leading-none text-white transition-opacity hover:opacity-80"
                  >
                    업그레이드
                  </button>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CreditIcon />
                    <span className="text-[14px] font-medium">200</span>
                  </div>
                  <div className="mr-[24px] flex items-center gap-1.5">
                    <PaperIcon />
                    <span className="text-[14px] font-medium">5/5</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <UserIcon size={38} />
                  <span className="text-[20px] font-semibold">닉네임</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSettingsClick();
                  }}
                  className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
                >
                  <SettingIcon
                    size={20}
                    className="cursor-pointer text-gray-400"
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex w-[80px] shrink-0 flex-col items-center gap-[20px] pb-[76px]">
              <div className="flex h-[28px] w-[60px] items-center justify-center gap-[10px] rounded-[8px] border-[0.5px] border-[#C6C6C6] px-[7px] py-[9px] shadow-sm">
                <CreditIcon />
                <span className="text-[10px] font-semibold text-gray-700">
                  200
                </span>
              </div>
              <UserIcon size={40} />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

// 검색 버튼 컴포넌트 (모달 열기용)
const SearchButton = ({
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        isCollapsed
          ? "flex w-full cursor-pointer items-center justify-center py-0 text-gray-500 transition-all hover:text-gray-900"
          : "mr-[14px] ml-2 flex w-[224px] cursor-pointer items-center gap-3 rounded-r-[12px] px-3 py-3 text-[#333333] transition-all hover:bg-gray-50"
      }
    >
      <div className="flex items-center justify-center">
        <Icon
          size={36}
          color="#666666"
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

// 메인 메뉴 아이템 컴포넌트
const NavItem = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
}) => {
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
        // 펼쳐진 상태
        if (isActive) {
          // 선택된 메뉴: 252px 전체 사용, 배경 + drop-shadow (둥근 모서리 따라감)
          return "relative z-10 flex w-[252px] cursor-pointer items-center gap-3 rounded-r-[12px] bg-[#FFFFFF] py-2 pr-3 pl-[22px] text-[#000000] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all";
        }
        // 일반 메뉴: 240px 범위 내
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
              className={`${
                isActive ? "text-[22px]" : "text-[18px]"
              } leading-[28px] font-semibold tracking-[-0.01%]`}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
