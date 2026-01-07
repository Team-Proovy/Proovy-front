import { useLocation, useNavigate } from "react-router-dom";

import { SidebarIconButton } from "./SidebarIconButton";
import {
  ChatIcon,
  FileIcon,
  HomeIcon,
  SlideIcon,
  StorageIcon,
  GeminiBadge,
  UserIconCircleButton,
} from "./SidebarIcons";

import geminiLogo from "../../../shared/assets/images/gemini.png";

export function LeftSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-[80px] flex-col rounded-r-[12px] border-[0.5px] border-[#C6C6C6] bg-white">
      {/* 피그마 기준 첫 아이콘 top: 41px */}
      <div className="flex flex-col items-center pt-[41px]">
        {/* 1) 슬라이드바 (40x40) */}
        <SidebarIconButton
          ariaLabel="sidebar toggle"
          size="40"
          onClick={() => console.log("toggle sidebar")}
        >
          <SlideIcon className="text-[#666]" />
        </SidebarIconButton>

        {/* 1 -> 2 간격 (41 -> 112 기준): 31px */}
        <div className="h-[31px]" />

        {/* 2) 홈 (36x36) */}
        <SidebarIconButton
          ariaLabel="home"
          size="36"
          onClick={() => navigate("/")}
        >
          <HomeIcon className="text-[#666]" />
        </SidebarIconButton>

        {/* 2 -> 3 간격: 24px */}
        <div className="h-[24px]" />

        {/* 3) 파일 기본 (36x36) */}
        <SidebarIconButton
          ariaLabel="file"
          size="36"
          onClick={() => console.log("go file/viewer")}
        >
          {/* outline은 currentColor(#666)로, 그라데이션은 SVG 자체 */}
          <FileIcon className="text-[#666]" />
        </SidebarIconButton>

        <div className="h-[24px]" />

        {/* 4) 채팅 (36x36) - 현재 페이지 */}
        <SidebarIconButton
          ariaLabel="chat"
          size="36"
          isActive={pathname === "/workspace"}
          onClick={() => navigate("/workspace")}
        >
          <ChatIcon className="text-[#2A6AFF]" />
        </SidebarIconButton>

        <div className="h-[24px]" />

        {/* 5) 보관함 (36x36) */}
        <SidebarIconButton
          ariaLabel="storage"
          size="36"
          onClick={() => console.log("go storage")}
        >
          <div className="text-[#666]">
            <StorageIcon />
          </div>
        </SidebarIconButton>
      </div>

      {/* 남는 공간 밀기 */}
      <div className="flex-1" />

      {/* 하단 영역 */}
      <div className="flex flex-col items-center">
        {/* 6) Gemini: 바닥에서 81px */}
        <div className="mb-[41px]">
          <GeminiBadge
            count={200}
            logoSrc={geminiLogo}
            onClick={() => console.log("gemini clicked")}
          />
        </div>

        {/* 7) User: 바닥에서 25px */}
        <div className="mb-[25px]">
          <UserIconCircleButton onClick={() => console.log("user clicked")} />
        </div>
      </div>
    </aside>
  );
}
