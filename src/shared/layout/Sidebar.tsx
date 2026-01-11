import ProovyLogo from "../../features/viewer/components/ProovyLogo";
import { Settings, ChevronLeft } from "lucide-react";
import React from "react";
import {
  ChattingIcon,
  HomeIcon,
  NoteIcon,
  RepositoryIcon,
  SlideIcon,
  UserIcon,
} from "../ui/sidebarIcons";
import { SidebarIconButton } from "../ui/SidebarIconButton";
// import gemini.png from "/Users/ldy/Desktop/proovy_project/Proovy-front/src/shared/assets/images/gemini.png"
import { NavLink } from "react-router-dom";
import { useState } from "react";

export function Sidebar() {
  // sidebar 접히고/펼치고 상태 관리
  // isCollapsed = true 이면 사이드바가 접힌 상태가 된다
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      onClick={() => {
        if (isCollapsed) setIsCollapsed(false);
      }}
      className={`flex h-screen flex-col border-r border-[#C6C6C6] bg-white transition-all duration-300 ${isCollapsed ? "w-[80px] cursor-pointer hover:bg-gray-50/50" : "w-[200px] px-2 py-4"}`}
    >
      <div className="flex h-full flex-col">
        {/* 1. 로고 및 접기 버튼 */}
        {/* 접혔을 때 로고와 버튼 사이 정렬을 위해 justify-center 동적 변경 */}
        <div className={`relative flex flex-col pt-[20px] ${isCollapsed ? "items-center mb-10" : ""}`}>
          {!isCollapsed ? (
            <div className="mb-6 flex w-full items-center justify-between">
              <ProovyLogo className="h-7 w-auto text-gray-900" />
              <button
                onClick={() => setIsCollapsed(true)}
                className="rounded p-1 transition-colors hover:bg-gray-100"
              >
                <ChevronLeft
                  size={19}
                  className="text-gray-400"
                />
              </button>
            </div>
          ) : (
            // 사이드바가 졉힌 상태인 경우:
            // 사이드바 펼치기 버튼
            <SidebarIconButton
              ariaLabel="sidebar toggle"
              size="36"
              onClick={() => setIsCollapsed(false)}
            >
              <SlideIcon color="#666" size={36} />
            </SidebarIconButton>
          )}
        </div>

        {/* 2. 메인 메뉴 */}
        {/* [추가] 사이드바 접힘/펼침 여부에 따른 로직 구현 */}
        <nav className="mb-8 space-y-1">
          <NavItem
            to="/"
            icon={HomeIcon}
            label="홈"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/testPage"
            icon={NoteIcon}
            label="노트 목록"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/chatting"
            icon={ChattingIcon}
            label="채팅"
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
          <div className="mt-auto space-y-4 border-t border-gray-100 pt-4">
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-[#2A6AFF]" />
                  <span className="text-[11px] text-gray-600">Free</span>
                </div>
                <button className="rounded bg-[#2A6AFF] px-[13px] py-[2.5px] text-[11px] text-white transition-opacity hover:opacity-80">
                  업그레이드
                </button>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span>✨</span>
                  <span className="font-medium">200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">📄</span>
                  <span className="font-medium">5/5</span>
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
          <div className="mt-auto flex flex-col items-center">
            <div className="mb-[41px]">
              {/* <GeminiBadge
                count={200}
                logoSrc={geminiLogo}
              /> */}
            </div>
            <div className="mb-[25px]">
              <button className="flex h-[40px] w-[40px] items-center justify-center rounded-full border-[0.5px] border-[#C6C6C6] bg-white transition hover:bg-black/5 active:scale-[0.98]">
                <UserIcon size={38} />
              </button>
            </div>
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
          return `flex w-full cursor-pointer items-center justify-center py-4 transition-all ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`;
        }
        return `flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-all gap-3 ${isActive ? "z-10 w-[108%] translate-x-1 bg-white shadow-xl text-blue-600 ring-1 ring-black/5" : "text-gray-600 hover:bg-gray-50"}`;
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
          {!isCollapsed && <span className="font-size-[12px] font-medium">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
