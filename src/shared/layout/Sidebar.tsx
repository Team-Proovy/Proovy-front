import ProovyLogo from "../../features/viewer/components/ProovyLogo";
import { Settings } from "lucide-react";
import React from "react";
import {
  BarArrowIcon,
  ChattingIcon,
  PaperIcon,
  HomeIcon,
  NoteIcon,
  RepositoryIcon,
  SlideIcon,
  UserIcon,
} from "../components/icons/SidebarIcons";
import { SidebarIconButton } from "../ui/SidebarIconButton";
import geminiLogo from "../assets/images/img_gemini.png";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  // sidebar 접히고/펼치고 상태 관리 -> 상위 컴포넌트(AppLayout)으로 위임
  // const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      onClick={() => {
        if (isCollapsed) onToggle(false);
      }}
      className={`flex min-h-[1024px] flex-col bg-white transition-all duration-300 ${isCollapsed ? "w-[80px] rounded-r-[12px] border-[0.5px] border-[#C6C6C6] cursor-pointer hover:bg-gray-50/50" : "w-[240px] border-r border-[#C6C6C6]"}`}
    >
      <div className="flex h-full flex-col">
        {/* 1. 로고 및 접기 버튼 */}
        {/* 접혔을 때 로고와 버튼 사이 정렬을 위해 justify-center 동적 변경 */}
        <div className={`relative flex flex-col pt-[41px] ${isCollapsed ? "items-center mb-8" : ""}`}>
          {!isCollapsed ? (
            <div className="mb-6 flex w-full items-center justify-between pl-[26px] pr-2">
              <ProovyLogo className="h-[35px] w-[120px] text-gray-900 aspect-[24/7]" />
              <button
                onClick={() => onToggle(true)}
                className="rounded p-1 transition-colors hover:bg-gray-100"
              >
                <BarArrowIcon
                  color="#666"
                  size={24}
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

        {/* 2. 메인 메뉴 */}
        {/* [추가] 사이드바 접힘/펼침 여부에 따른 로직 구현 */}
        <nav className={`mb-8 ${isCollapsed ? "flex flex-col gap-[24px]" : "space-y-1 px-2 font-[Pretendard] font-normal "}`}>
          <NavItem
            to="/"
            icon={HomeIcon}
            label="홈"
            isCollapsed={isCollapsed}
          />
           <NavItem
            to="/chatting"
            icon={ChattingIcon}
            label="채팅"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/note"
            icon={NoteIcon}
            label="노트 목록"
            isCollapsed={isCollapsed}
          />
         
          <NavItem
            to="/repository"
            icon={RepositoryIcon}
            label="저장소"
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* 3. 하단 유저 및 상태 정보 */}
        {/* 사이드바가 펼쳐졌을 때(false)만 하단 user 정보(요금제, 프로필..)를 보여주는 로직 추가됨 */}
        {!isCollapsed ? (
          <div className="mt-auto  mb-[76px] space-y-4 border-t border-gray-100 px-[20px]">
            <div className="space-y-4 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white p-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#2A6AFF]" />
                  <span className="font-['Pretendard'] text-[14px] font-medium leading-[20px] text-[#333333]">
                    Free
                  </span>
                </div>
                <button className="flex h-[24px] w-[88px] items-center justify-center rounded bg-[#2A6AFF] text-[14px] leading-none text-white transition-opacity hover:opacity-80">
                  업그레이드
                </button>
              </div>
              <div className="flex items-center justify-between text-gray-500 ">
                <div className="flex items-center gap-1.5">
                  <img src={geminiLogo} alt="Gemini" className="h-3 w-3" />
                  <span className="text-[14px] font-medium">200</span>
                </div>
                <div className="flex items-center gap-1.5 mr-[24px]">
                  <PaperIcon />
                  <span className="text-[14px] font-medium">5/5</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <span className="text-sm font-medium">닉네임</span>
              </div>
              <Settings
                size={17}
                className="cursor-pointer text-gray-400"
              />
            </div>
          </div>
        ) : (
          // 접힌 상태 UI: GeminiBadge 및 UserIcon 반영
          <div className="mt-auto flex flex-col items-center mb-[76px] gap-[20px]">
            <div className="flex h-[28px] w-[60px] items-center justify-center gap-[10px] rounded-[8px] border-[0.5px] border-[#C6C6C6] py-[9px] px-[7px] shadow-sm">
              <img
                src={geminiLogo}
                alt="Gemini Logo"
                className="h-3 w-3"
              />
              <span className="text-[10px] font-semibold text-gray-700">200</span>
            </div>
            <button className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-[0.5px] border-[#C6C6C6] bg-white transition hover:bg-black/5 active:scale-[0.98]">
              <UserIcon size={38} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
// Sidebar 함수 정의
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
      onClick={(e) => e.stopPropagation()} // 메뉴 어딘가(?) 클릭 시 aside 펼처짐 이벤트 방지
      className={({ isActive }) => {
        if (isCollapsed) {
          // 사이드바가 접힌 상태인 경우:
          return `flex w-full cursor-pointer items-center px-[20px] py-0 transition-all ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`;
        }
        return `flex cursor-pointer items-center gap-3 rounded-l-none rounded-r-[12px] px-3 py-2.5 transition-all ${isActive ? "z-10 w-[252px] -ml-2 pl-[20px] bg-white text-blue-600 shadow-xl ring-1 ring-black/5" : "text-gray-600 hover:bg-gray-50"}`;
      }}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center justify-center">
            <Icon
              size={isCollapsed ? 36 : 28}
              color={isActive ? "#2A6AFF" : "#9CA3AF"}
            />
          </div>
          {/* 사이드바 펼쳤을때만(false) 메뉴 글자들 ui에 표시하기 */}
          {!isCollapsed && (
            <span className="font-['Pretendard'] text-[18px] font-semibold leading-[28px] tracking-[-0.01%]">{label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}
