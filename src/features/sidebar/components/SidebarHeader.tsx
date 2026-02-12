// 이 컴포넌트는 사이드바의 최상단 영역인 로고와 접기/펴기 버튼을 담당합니다.
import { ProovyLogo } from "../../../shared/components/icons/ProovyLogo";
import {
  BarArrowIcon,
  SlideIcon,
} from "../../../shared/components/icons/SidebarIcons";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  onLogoClick: () => void;
}

export const SidebarHeader = ({
  isCollapsed,
  onToggle,
  onLogoClick,
}: SidebarHeaderProps) => {
  return (
    <div
      className={`relative flex shrink-0 flex-col pt-[41px] ${
        isCollapsed ? "mb-2 pl-[18px]" : ""
      }`}
    >
      {!isCollapsed ? (
        <div className="mb-2 flex w-[240px] items-center justify-between pr-2 pl-[15px]">
          <div
            onClick={onLogoClick}
            className="cursor-pointer select-none"
          >
            <ProovyLogo className="h-[40px] w-[140px] text-gray-900" />
          </div>
          <button
            onClick={() => onToggle(true)}
            className="group rounded p-1 transition-colors"
          >
            <BarArrowIcon
              className="mr-2 cursor-pointer text-[#6B7280] transition-colors duration-500 group-hover:text-[#2A6AFF]"
              size={26}
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="sidebar toggle"
          onClick={() => onToggle(false)}
          className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[8px] select-none focus:outline-none"
        >
          <SlideIcon
            color="#6B7280"
            size={40}
          />
        </button>
      )}
    </div>
  );
};
