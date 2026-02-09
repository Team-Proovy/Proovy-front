import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useState } from "react";

// Features
import { Sidebar } from "../../features/sidebar/Sidebar";
import SearchModal from "@/features/search/components/SearchModal";
import { SettingsModal } from "../../features/settings/components/SettingsModal";

/**
 * AppLayout - 앱 전체 레이아웃
 *
 * Protected Routes (/app/*) 에서 사용
 * Sidebar + Outlet 구조
 */
export const AppLayout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // URL 쿼리 파라미터로 검색 모달 상태 관리
  const isSearchOpen = searchParams.get("search") === "true";

  const handleCloseSearch = () => {
    // 쿼리 파라미터 제거하여 모달 닫기
    navigate(location.pathname);
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA]">
      {/* 왼쪽 사이드바 - z-10으로 main 위에 표시 (선택된 메뉴 튀어나옴 효과) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={setIsCollapsed}
        onSearchClick={() => {}} // SearchButton 내부에서 처리됨
        onSettingsClick={() => setIsSettingsOpen(true)}
        onUpgradeClick={() => navigate("/pricing")}
        onLogoClick={() => navigate("/app/home")}
      />

      {/* 오른쪽 본문 영역 (Outlet) - 사이드바 너비에 따라 자동으로 밀림 */}
      <main className="relative flex flex-1 flex-col overflow-hidden whitespace-nowrap transition-all duration-300">
        <Outlet />
      </main>

      {/* 모달들 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
