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

  const isSearchOpen = searchParams.get("search") === "true";

  const handleCloseSearch = () => {
    navigate(location.pathname);
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA]">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={setIsCollapsed}
        onSearchClick={() => {}} // SearchButton 내부에서 처리
        onSettingsClick={() => setIsSettingsOpen(true)}
        onUpgradeClick={() => navigate("/pricing")}
        onLogoClick={() => navigate("/app/home")}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden whitespace-nowrap transition-all duration-300">
        <Outlet />
      </main>

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
