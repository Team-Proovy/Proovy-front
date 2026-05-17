import {
  HomeIcon,
  RepositoryIcon,
  SearchIcon,
} from "../../shared/components/icons/SidebarIcons";
import { SidebarHeader } from "./components/SidebarHeader";
import { NavItem } from "./components/NavItem";
import { SearchButton } from "./components/SearchButton";
import { RecentNotes } from "./components/RecentNotes";
import { SidebarProfile } from "./components/SidebarProfile";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onUpgradeClick: () => void;
  onLogoClick: () => void;
  onHomeClick: () => void;
}

export const Sidebar = ({
  isCollapsed,
  onToggle,
  onSearchClick,
  onSettingsClick,
  onUpgradeClick,
  onLogoClick,
  onHomeClick,
}: SidebarProps) => {
  return (
    <div
      className={`relative z-10 h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "-mr-[20px] w-[260px]"
      }`}
    >
      <aside className="relative flex h-full flex-col">
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-0 rounded-r-[12px] border-y-[0.5px] border-r-[0.5px] border-[#E3E7ED] bg-white transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-[72px]" : "w-[240px]"
          }`}
        />

        {/* 헤어: 로고, 여닫이 아이콘 */}
        <div className="relative z-10 flex h-full flex-col">
          <SidebarHeader
            isCollapsed={isCollapsed}
            onToggle={onToggle}
            onLogoClick={onLogoClick}
          />

          {/* 메인 메뉴 영역 (고정) */}
          <nav
            className={`w-[240px] shrink-0 ${isCollapsed ? "mb-8 flex flex-col gap-[12px] py-3" : "mb-[52px] flex flex-col gap-[12px] py-3"}`}
          >
            <NavItem
              to="/app/home"
              icon={HomeIcon}
              label="홈"
              isCollapsed={isCollapsed}
              onClick={(e) => {
                e.preventDefault();
                onHomeClick();
              }}
            />
            <SearchButton
              icon={SearchIcon}
              label="검색"
              isCollapsed={isCollapsed}
              onClick={onSearchClick}
            />
            <NavItem
              to="/app/storage"
              icon={RepositoryIcon}
              label="저장소"
              isCollapsed={isCollapsed}
            />
          </nav>

          {/* 최근 노트 목록 (남은 공간 채움) */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <RecentNotes isCollapsed={isCollapsed} />
          </div>

          {/* 하단 프로필 및 설정 */}
          <SidebarProfile
            isCollapsed={isCollapsed}
            onToggle={onToggle}
            onUpgradeClick={onUpgradeClick}
            onSettingsClick={onSettingsClick}
          />
        </div>
      </aside>
    </div>
  );
};
