import type { SettingsTab } from "../types/settings";
import { SETTINGS_MENU_ITEMS } from "../types/settings";
import {
  ProfileIcon,
  SubscriptionIcon,
  CreditIcon,
} from "../../../shared/components/icons/SettingsIcons";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onLogout: () => void;
}

/**
 * 설정 사이드바
 *
 * - 너비: 250px (선택된 메뉴는 +18px 튀어나옴)
 * - 메뉴: 내 프로필, 구독 정보, 크레딧 사용내역
 * - 하단: 로그아웃 버튼
 */
export const SettingsSidebar = ({
  activeTab,
  onTabChange,
  onLogout,
}: SettingsSidebarProps) => {
  // 탭별 아이콘 매핑
  const getIcon = (tabId: SettingsTab, isActive: boolean) => {
    const size = 36;

    switch (tabId) {
      case "profile":
        return (
          <ProfileIcon
            color={isActive ? "#2A6AFF" : "#6B7280"}
            size={size}
          />
        );
      case "subscription":
        return (
          <SubscriptionIcon
            isActive={isActive}
            size={size}
          />
        );
      case "credit":
        return (
          <CreditIcon
            isActive={isActive}
            size={size}
          />
        );
    }
  };

  return (
    <div className="relative flex h-full w-[268px] flex-col">
      {/* 배경 레이어 - 250px */}
      <div className="absolute inset-y-0 left-0 w-[250px] rounded-tl-[20px] rounded-bl-[20px] border-[0.5px] border-[#D1D6DE] bg-white" />

      {/* 컨텐츠 레이어 */}
      <div className="relative z-10 flex h-full flex-col px-[40px] pt-[38px] pb-[30px]">
        {/* 타이틀 */}
        <h2 className="mb-[30px] font-['Pretendard'] text-[20px] leading-[28px] font-semibold tracking-[-0.002em] text-black">
          설정
        </h2>

        {/* 메뉴 리스트 */}
        <nav className="flex flex-col gap-[8px]">
          {SETTINGS_MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-[12px] rounded-r-[12px] py-[10px] pl-0 text-left transition-all cursor-pointer ${
                  isActive
                    ? "-ml-[40px] w-[268px] bg-white pl-[40px] shadow-[0px_4px_10px_2px_rgba(0,0,0,0.1)]"
                    : "w-full hover:opacity-70"
                }`}
              >
                {/* 아이콘 */}
                <div className="flex h-[36px] w-[36px] items-center justify-center">
                  {getIcon(item.id, isActive)}
                </div>

                {/* 라벨 */}
                <span
                  className={`font-['Pretendard'] leading-[28px] tracking-[-0.0018em] ${
                    isActive
                      ? "text-[22px] font-bold text-black"
                      : "text-[18px] font-semibold text-[#2F3440]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 스페이서 */}
        <div className="flex-1" />

        
      </div>
    </div>
  );
};
