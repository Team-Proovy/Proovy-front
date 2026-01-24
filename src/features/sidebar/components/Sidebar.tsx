import React from "react";
import { NavLink } from "react-router-dom";
import { Settings } from "lucide-react";

// Shared
import { ProovyLogo } from "../../../shared/components/ProovyLogo";
import {
  BarArrowIcon,
  ChattingIcon,
  PaperIcon,
  HomeIcon,
  NoteIcon,
  RepositoryIcon,
  SlideIcon,
  UserIcon,
} from "../../../shared/components/icons/SidebarIcons";
import { SidebarIconButton } from "../../../shared/ui/SidebarIconButton";
import geminiLogo from "../../../shared/assets/images/img_gemini.png";

// Sidebar Components
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
  // sidebar 접히고/펼치고 상태 관리 -> 상위 컴포넌트(AppLayout)으로 위임
  // const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      onClick={() => {
        if (isCollapsed) onToggle(false);
      }}
      style={{ clipPath: isCollapsed ? undefined : "inset(0 -20px 0 0)" }}
      className={`z-50 flex h-full flex-col bg-white transition-all duration-300 ${isCollapsed ? "w-[80px] cursor-pointer rounded-r-[12px] border-[0.5px] border-[#C6C6C6] hover:bg-gray-50/50" : "w-[240px] rounded-r-[12px] border-r border-[#C6C6C6]"}`}
    >
      <div className="flex h-full flex-col">
        {/* 1. 로고 및 접기 버튼 (고정) */}
        {/* 접혔을 때 로고와 버튼 사이 정렬을 위해 justify-center 동적 변경 */}
        <div
          className={`relative flex shrink-0 flex-col pt-[41px] ${isCollapsed ? "mb-8 items-center" : ""}`}
        >
          {!isCollapsed ? (
            <div className="mb-6 flex w-full items-center justify-between pr-2 pl-3">
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
            // {사이드바가 졉힌 상태인 경우}

            // 사이드바 펼치기 버튼
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
        {/* clip-path로 오른쪽만 열어서 튀어나온 효과 허용 */}
        <div
          className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ clipPath: "inset(0 -20px 0 0)" }}
        >
          {/* 메인 메뉴 */}
          <nav
            className={`${isCollapsed ? "mb-8 flex flex-col gap-[24px]" : "mb-4 flex flex-col gap-[2px] px-2 font-normal"}`}
          >
            <NavItem
              to="/app/home"
              icon={HomeIcon}
              label="홈"
              isCollapsed={isCollapsed}
            />
            {/* 검색 - 모달로 열기 (페이지 이동 X) */}
            <SearchButton
              icon={ChattingIcon}
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
          <RecentNotes isCollapsed={isCollapsed} />
        </div>

        {/* 3. 하단 유저 및 상태 정보 (고정) */}
        {/* 사이드바가 펼쳐졌을 때(false)만 하단 user 정보(요금제, 프로필..)를 보여주는 로직 추가됨 */}
        {!isCollapsed ? (
          <div className="shrink-0 space-y-4 border-t border-gray-100 px-[20px] pt-4 pb-[20px]">
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
                  <img
                    src={geminiLogo}
                    alt="Gemini"
                    className="h-3 w-3"
                  />
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
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <span className="text-[20px] font-semibold">닉네임</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettingsClick();
                }}
                className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        ) : (
          // 접힌 상태 UI: GeminiBadge 및 UserIcon 반영
          <div className="flex shrink-0 flex-col items-center gap-[20px] pb-[76px]">
            <div className="flex h-[28px] w-[60px] items-center justify-center gap-[10px] rounded-[8px] border-[0.5px] border-[#C6C6C6] px-[7px] py-[9px] shadow-sm">
              <img
                src={geminiLogo}
                alt="Gemini Logo"
                className="h-3 w-3"
              />
              <span className="text-[10px] font-semibold text-gray-700">
                200
              </span>
            </div>
            <button className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-[0.5px] border-[#C6C6C6] bg-white transition hover:bg-black/5 active:scale-[0.98]">
              <UserIcon size={38} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

// 검색 버튼 컴포넌트 (모달 열기용, 페이지 이동 X)
function SearchButton({
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        isCollapsed
          ? "flex w-full cursor-pointer items-center px-[20px] py-0 text-gray-500 transition-all hover:text-gray-900"
          : "flex cursor-pointer items-center gap-3 rounded-l-none rounded-r-[12px] px-3 py-3 text-[#333333] transition-all hover:bg-gray-50"
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
}

// 메인 메뉴 아이템 컴포넌트
function NavItem({
  to, // 이동할 경로 추가
  icon: Icon,
  label,
  isCollapsed,
}: {
  to: string;
  icon: React.ElementType; // 아이콘 컴포넌트 타입
  label: string;
  active?: boolean;
  isCollapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      onClick={(e) => e.stopPropagation()} // 사이드바 아무 빈 영역 클릭 시 사이드바 펼처짐 이벤트 방지
      className={({ isActive }) => {
        if (isCollapsed) {
          // 사이드바가 접힌 상태인 경우:
          return `flex w-full cursor-pointer items-center px-[20px] py-0 transition-all ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`;
        }
        // 사이드바가 펼쳐진 상태인 경우:
        return `flex cursor-pointer items-center gap-3 rounded-l-none rounded-r-[12px] px-3 ${isActive ? "py-2" : "py-3"} transition-all ${isActive ? "z-10 -ml-2 w-[252px] bg-white pl-[20px] text-[#000000] shadow-[0px_4px_10px_2px_rgba(0,0,0,0.1)]" : "text-[#333333]"}`;
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
          {/* 사이드바 펼쳤을때 메뉴 글자들 ui에 표시하기 */}
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
}
