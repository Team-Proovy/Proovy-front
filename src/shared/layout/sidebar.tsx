import ProovyLogo from "../../features/viewer/components/ProovyLogo";
import {
  Settings,
  ChevronLeft,
  ChevronRightIcon,
  ChevronRight,
} from "lucide-react";
import React from "react";
import { ChattingIcon, HomeIcon, NoteIcon, RepositoryIcon } from "../ui/icons";
import { NavLink } from "react-router-dom";
import { useState } from "react";

export function Sidebar() {
  // sidebar 접히고/펼치고 상태 관리
  // isCollapsed = true 이면 사이드바가 접힌 상태가 된다
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      // (추가) isCollapsed 상태에 따라 w-20(접힘) 또는 w-64(펼침) 적용함.
      className={`flex h-screen w-64 flex-col border-r border-gray-100 bg-white p-4 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* 1. 로고 및 접기 버튼 */}
      {/* 접혔을 때 로고와 버튼 사이 정렬을 위해 justify-center 동적 변경 */}
      <div
        className={`mb-8 flex items-center px-2 ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {/* 접히지 않았을 때(false)만 로고를 보여줌 */}
        {!isCollapsed && (
          <div className="flex items-center">
            <ProovyLogo className="h-8 w-auto text-gray-900" />
          </div>
        )}
        {/* 버튼 클릭 시 setIsCollapsed 상태 반전시킴 */}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
          className="rounded p-1 transition-colors hover:bg-gray-100"
        >
          {/* 접힌 상태(isCollapsed)에 따라 ui에 보이는 화살표 방향 변경 */}
          {isCollapsed ? (
            <ChevronRight
              size={20}
              className="text-gray-400"
            />
          ) : (
            <ChevronLeft
              size={20}
              className="text-gray-400"
            />
          )}
        </button>
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
          to="/note"
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
          <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600">
                Free
              </span>
              <button className="rounded bg-[#2A6AFF] px-4 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-80">
                업그레이드
              </button>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>✨ 200</span>
              <span>📄 5/5</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <span className="text-sm font-medium">닉네임</span>
            </div>
            <Settings
              size={18}
              className="cursor-pointer text-gray-400"
            />
          </div>
        </div>
      ) : (
        /* [추가] 접혔을 때 하단에는 설정 버튼이나 아바타 아이콘만 심플하게 배치 가능 */
        <div className="mt-auto flex flex-col items-center gap-4 border-t border-gray-100 pt-4">
          <Settings
            size={18}
            className="cursor-pointer text-gray-400"
          />
        </div>
      )}
    </aside>
  );
}
// Sidebar 함수 정의
// 메인 메뉴 아이템 컴포넌트
function NavItem({
  to, // 이동할 경로 추가
  icon: Icon,
  label,
  active,
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
      className={({ isActive }) =>
        // sidebar 접히면 아이콘을 중앙으로, 펼치면 gap생기게 구현
        `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all ${isCollapsed ? "justify-center" : "gap-3"} ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex h-7 w-7 items-center justify-center">
            <Icon
              size={26}
              color={isActive ? "#2A6AFF" : "#9CA3AF"}
            />
          </div>
          {/* 사이드바 펼쳤을때만(false) 메뉴 글자들 ui에 표시하기 */}
          {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
