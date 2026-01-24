import ProovyLogo from "../../features/viewer/components/ProovyLogo";

import React, { useEffect, useState } from "react";
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
      className={`sticky top-0 h-screen flex flex-col bg-white transition-all duration-300 ${isCollapsed ? "w-[80px] cursor-pointer rounded-r-[12px] border-[0.5px] border-[#C6C6C6] hover:bg-gray-50/50" : "w-[240px] border-r border-[#C6C6C6]"}`}
    >
      <div className="flex h-full flex-col">
        {/* 1. 로고 및 접기 버튼 */}
        {/* 접혔을 때 로고와 버튼 사이 정렬을 위해 justify-center 동적 변경 */}
        <div
          className={`relative flex flex-col pt-[41px] ${isCollapsed ? "mb-8 items-center" : ""}`}
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

        {/* 2. 메인 메뉴 */}
        {/* [추가] 사이드바 접힘/펼침 여부에 따른 로직 구현 */}
        <nav
          className={`mb-2 ${isCollapsed ? "flex flex-col gap-[24px]" : "flex flex-col gap-[2px] px-2 font-normal"}`}
        >
          <NavItem
            to="/"
            icon={HomeIcon}
            label="홈"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/search"
            icon={SearchIcon}
            label="검색"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/note"
            icon={NoteIcon}
            label="노트목록"
            isCollapsed={isCollapsed}
          />

          <NavItem
            to="/repository"
            icon={RepositoryIcon}
            label="저장소"
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* 3. 최근 노트 */}
        {/* 사이드바 펼쳤을때 "최근 노트 목록 보여주는 부분" */}
        {!isCollapsed && <RecentNotesSection />}

        {/* 4. 하단 유저 및 상태 정보 */}
        {/* 사이드바가 펼쳐졌을 때(false)만 하단 user 정보(요금제, 프로필..)를 보여주는 로직 추가됨 */}
        {!isCollapsed ? (
          <div className="mt-auto mb-[20px] space-y-4 border-t border-gray-100 px-[20px]">
            <div className="space-y-4 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white p-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#2A6AFF]" />
                  <span className="text-[14px] leading-[20px] font-medium text-[#333333]">
                    Free
                  </span>
                </div>
                <button className="flex h-[24px] w-[88px] items-center justify-center rounded bg-[#2A6AFF] text-[14px] leading-none text-white transition-opacity hover:opacity-80">
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
              <SettingIcon
                size={20}
                className="cursor-pointer text-gray-400"
              />
            </div>
          </div>
        ) : (
          // 접힌 상태 UI: GeminiBadge 및 UserIcon 반영
          <div className="mt-auto mb-[76px] flex flex-col items-center gap-[20px]">
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
}

// Recent Notes Section Component
function RecentNotesSection() {
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    // TODO: API 호출 로직 추가
    console.log("최근 노트 호출 로직 추가 필요");
    // fetch('/api/notes/recent').then(...)
    setNotes([
      { id: "1", title: "최근 노트 1" },
      { id: "2", title: "최근 노트 2" },
      { id: "3", title: "최근 노트 3" },
    ]);
  }, []);

  return (
    <div className="px-6 mb-4">
      <h3 className="text-[12px] font-normal text-[#454545] mb-[12px] leading-[160%] tracking-[-0.05em]">최근 노트</h3>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <NavLink
              to={`/note/${note.id}`}
              className={({ isActive }) =>
                `truncate transition-colors text-[14px] font-bold flex items-center px-2 ${
                  isActive
                    ? "w-[178px] h-[32px] rounded-[9px] bg-[#EBEBEB] text-[#454545]"
                    : "py-1.5 rounded text-[#454545] hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {note.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
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
