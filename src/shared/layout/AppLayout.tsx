import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { SearchModal } from "../../features/search/components/SearchModal";

/**
 * AppLayout - 앱 전체 레이아웃
 *
 * Protected Routes (/app/*) 에서 사용
 * Sidebar + Outlet 구조
 */
export const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // TODO: 인증 체크 로직 추가 예정
  // const { isAuthenticated, isLoading } = useAuth();
  // if (isLoading) return <LoadingSpinner />;
  // if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA]">
      {/* 왼쪽 사이드바 */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={setIsCollapsed}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* 오른쪽 본문 영역 (Outlet) - 사이드바 너비에 따라 자동으로 밀림 */}
      <main className="relative flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Outlet />
      </main>

      {/* 검색 모달 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};
