/**
 * 설정 모달 탭 타입
 */
export type SettingsTab = "profile" | "subscription" | "credit";

/**
 * 탭 메뉴 아이템 정의
 */
export interface SettingsMenuItem {
  id: SettingsTab;
  label: string;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { id: "profile", label: "내 프로필" },
  { id: "subscription", label: "구독 정보" },
  { id: "credit", label: "크레딧 사용내역" },
];
