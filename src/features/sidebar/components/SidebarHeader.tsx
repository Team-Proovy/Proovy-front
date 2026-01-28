// 이 컴포넌트는 사이드바의 최상단 영역인 로고와 접기/펴기 버튼을 담당합니다.
import { ProovyLogo } from "../../../shared/components/ProovyLogo";
import {
  BarArrowIcon,
  SlideIcon,
} from "../../../shared/components/icons/SidebarIcons";
import { SidebarIconButton } from "./SidebarIconButton";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export const SidebarHeader = ({
  isCollapsed,
  onToggle,
}: SidebarHeaderProps) => {
  return (
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
  );
};
