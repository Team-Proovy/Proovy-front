import ProovyLogo from "../../features/viewer/components/ProovyLogo";
import { Settings, ChevronLeft } from "lucide-react";
import React from "react";
import { ChattingIcon, HomeIcon, NoteIcon, RepositoryIcon } from "../ui/icons";
import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-100 bg-white p-4">
      {/* 1. 로고 및 접기 버튼 */}
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center">
          {/* 로고 컴포넌트 사용: h-8은 높이 약 32px, w-auto로 가로세로 비율 유지 */}
          <ProovyLogo className="h-8 w-auto text-gray-900" />
        </div>
        <button className="rounded p-1 transition-colors hover:bg-gray-100">
          <ChevronLeft
            size={20}
            className="text-gray-400"
          />
        </button>
      </div>
      {/* 2. 메인 메뉴 */}
      <nav className="mb-8 space-y-1">
        <NavItem
          to="/"
          icon={HomeIcon}
          label="홈"
        />
        <NavItem
          to="/testPage"
          icon={NoteIcon}
          label="노트 목록"
        />
        <NavItem
          to="/chatting"
          icon={ChattingIcon}
          label="채팅"
        />
        <NavItem
          to="/repository"
          icon={RepositoryIcon}
          label="저장소"
        />
      </nav>

      {/* 3. 하단 유저 및 상태 정보 */}
      <div className="mt-auto space-y-4 border-t border-gray-100 pt-4">
        {/* 요금제/포인트 정보 */}
        <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600">
              Free
            </span>
            <button className="font-bold text-blue-600">업그레이드</button>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>✨ 200</span>
            <span>📄 5/5</span>
          </div>
        </div>

        {/* 유저 프로필 */}
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
}: {
  to: string;
  icon: React.ElementType; // 아이콘 컴포넌트 타입
  label: string;
  active?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"} `
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
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}
