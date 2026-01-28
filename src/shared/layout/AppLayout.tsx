import { Outlet } from "react-router-dom";
import { useState } from "react";

// Features
import { Sidebar } from "../../features/sidebar/Sidebar";
import { SearchModal } from "../../features/search/components/SearchModal";
import { SettingsModal } from "../../features/settings/components/SettingsModal";
import { UpgradeModal } from "../../features/subscription/components/UpgradeModal";

/**
 * AppLayout - 앱 전체 레이아웃
 *
 * Protected Routes (/app/*) 에서 사용
 * Sidebar + Outlet 구조
 */
export const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // TODO: 인증 체크 로직 추가 예정
  // const { isAuthenticated, isLoading } = useAuth();
  // if (isLoading) return <LoadingSpinner />;
  // if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA]">
      {/* 왼쪽 사이드바 - z-10으로 main 위에 표시 (선택된 메뉴 튀어나옴 효과) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={setIsCollapsed}
        onSearchClick={() => setIsSearchOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onUpgradeClick={() => setIsUpgradeOpen(true)}
      />

      {/* 오른쪽 본문 영역 (Outlet) - 사이드바 너비에 따라 자동으로 밀림 */}
      <main className="relative flex flex-1 flex-col overflow-hidden whitespace-nowrap transition-all duration-300">
        <Outlet />
      </main>

      {/* 모달들 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
};
