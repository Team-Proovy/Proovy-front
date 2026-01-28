import {
  HomeIcon,
  NoteIcon,
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
}

export const Sidebar = ({
  isCollapsed,
  onToggle,
  onSearchClick,
  onSettingsClick,
  onUpgradeClick,
}: SidebarProps) => {
  return (
    <div
      className={`relative z-10 h-full min-h-[600px] shrink-0 transition-all duration-300 ${isCollapsed ? "w-[80px]" : "w-[240px]"}`}
    >
      <aside
        onClick={() => isCollapsed && onToggle(false)}
        className={`relative flex h-full flex-col transition-all duration-300 ${isCollapsed ? "w-[80px] cursor-pointer" : "w-[252px]"}`}
      >
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-0 rounded-r-[12px] bg-white transition-all duration-300 ${isCollapsed ? "w-[80px] border-[0.5px] border-[#C6C6C6]" : "w-[240px] shadow-[1px_0_0_0_#C6C6C6]"}`}
        />

        <div className="relative z-10 flex h-full flex-col">
          <SidebarHeader
            isCollapsed={isCollapsed}
            onToggle={onToggle}
          />

          {/* 메인 메뉴 영역 (스크롤 가능) */}
          <div
            className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isCollapsed ? "w-[80px]" : "w-[270px]"}`}
          >
            <nav
              className={`${isCollapsed ? "mb-8 flex flex-col gap-[24px]" : "mb-4 flex flex-col gap-[2px] py-3"}`}
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

          {/* 하단 프로필 및 설정 */}
          <SidebarProfile
            isCollapsed={isCollapsed}
            onUpgradeClick={onUpgradeClick}
            onSettingsClick={onSettingsClick}
          />
        </div>
      </aside>
    </div>
  );
};
