// 이 컴포넌트는 사이드바의 최하단 영역인 프로필, 요금제 정보, 설정 버튼 등을 담당합니다.
import {
  UserIcon,
  SettingIcon,
  CreditIcon,
} from "../../../shared/components/icons/SidebarIcons";

import { useState } from "react";
import { useAuthStore } from "../../auth/store/auth_store";
import { useMyProfile } from "@/features/settings/hooks/useUser";
import { normalizePlanType } from "@/features/subscription/types/plan_types";

interface SidebarProfileProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  onUpgradeClick: () => void;
  onSettingsClick: () => void;
}

export const SidebarProfile = ({
  isCollapsed,
  onToggle,
  onUpgradeClick,
  onSettingsClick,
}: SidebarProfileProps) => {
  const [isUserIconHovered, setIsUserIconHovered] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const { data: profile } = useMyProfile();

  const planType = normalizePlanType(
    profile?.subscription?.plan ?? authUser?.plan,
  );
  const creditTotal = profile?.credit.totalAvailable ?? 0;
  const creditMax =
    (profile?.credit.dailyCredit.limit ?? 0) +
    (profile?.credit.monthlyCredit.limit ?? 0);
  const creditPercent =
    creditMax > 0 ? Math.min((creditTotal / creditMax) * 100, 100) : 0;

  // 닉네임 포맷팅 (한글 5자, 영문/숫자 8자 제한)
  const formatNickname = (nickname?: string) => {
    if (!nickname) return "";

    const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(nickname);
    const maxLength = hasKorean ? 5 : 8;

    if (nickname.length > maxLength) {
      return `${nickname.slice(0, maxLength)}...`;
    }
    return nickname;
  };
  return !isCollapsed ? (
    <div className="w-[240px] shrink-0 space-y-4 px-[20px] pt-4 pb-[20px]">
      <div className="rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white p-3 select-none">
        {/* 크레딧 수치 */}
        <div className="mb-2 flex items-center gap-1.5">
          <CreditIcon size={18} />
          <span className="text-[13px] font-medium text-[#333333]">
            크레딧 <span className="text-[#2A6AFF]">{creditTotal}</span>
            <span className="text-[#9CA4B0]">/{creditMax}</span>
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="mb-3 h-[5px] w-full overflow-hidden rounded-full bg-[#E8ECF5]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2A6AFF] to-[#85B0FF] transition-all duration-300"
            style={{ width: `${creditPercent}%` }}
          />
        </div>

        {/* 플랜 뱃지 + 업그레이드 버튼 */}
        <div className="flex items-center justify-between">
          <PlanBadge plan={planType} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpgradeClick();
            }}
            className="flex h-[24px] items-center justify-center rounded-[6px] border border-[#D1D6DE] bg-white px-2.5 text-[11px] font-semibold text-[#2F3440] transition-colors hover:bg-[#F5F5F5]"
          >
            업그레이드
          </button>
        </div>
      </div>

      <div
        className="flex w-[200px] cursor-pointer items-center justify-between rounded-[12px] px-2 py-1 transition-colors hover:bg-gray-100"
        onClick={() => {
          onSettingsClick();
        }}
      >
        <div className="flex items-center gap-2">
          <UserIcon size={40} />
          <span className="pt-[2px] text-[20px] font-semibold">
            {formatNickname(authUser?.nickname)}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }}
          className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors"
        >
          <SettingIcon
            size={20}
            className="cursor-pointer text-gray-400"
          />
        </button>
      </div>
    </div>
  ) : (
    <div className="flex w-[80px] shrink-0 flex-col items-center gap-[12px] pb-[23px]">
      <div
        onClick={() => onToggle(false)}
        className="flex h-[26px] w-[60px] cursor-pointer items-center justify-center gap-[6px] rounded-[8px] border-[0.5px] border-[#D1D6DE] px-[7px] py-[9px] shadow-sm transition-colors hover:bg-gray-50"
      >
        <CreditIcon size={22} />
        <span className="text-[10px] font-semibold text-[#2F3440]">
          {creditTotal}
        </span>
      </div>
      <button
        type="button"
        className="cursor-pointer border-none bg-transparent p-0"
        onMouseEnter={() => setIsUserIconHovered(true)}
        onMouseLeave={() => setIsUserIconHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSettingsClick();
        }}
      >
        <UserIcon
          size={40}
          color={isUserIconHovered ? "#85B0FF" : "#2A6AFF"}
        />
      </button>
    </div>
  );
};

const PlanBadge = ({ plan }: { plan: string }) => {
  if (plan === "Pro") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[#003880] px-2.5 py-[3px] text-[11px] font-semibold text-white">
        <CreditIcon size={12} />
        Pro
      </span>
    );
  }
  if (plan === "Standard") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[#2A6AFF] px-2.5 py-[3px] text-[11px] font-semibold text-white">
        <CreditIcon size={12} />
        Std
      </span>
    );
  }
  return (
    <span className="flex items-center rounded-full border border-[#D1D6DE] bg-white px-2.5 py-[3px] text-[11px] font-semibold text-[#2F3440]">
      Free
    </span>
  );
};
