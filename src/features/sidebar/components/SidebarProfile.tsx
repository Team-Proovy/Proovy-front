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

  const formatNickname = (nickname?: string) => {
    if (!nickname) return "";
    const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(nickname);
    const maxLength = hasKorean ? 5 : 8;
    if (nickname.length > maxLength)
      return `${nickname.slice(0, maxLength)}...`;
    return nickname;
  };

  return (
    <div className="relative shrink-0">
      {/* ── 펼쳐진 상태 (항상 flow에 유지 → 컨테이너 높이 고정) ── */}
      <div
        className={`w-[240px] space-y-4 pt-4 pb-[20px] transition-opacity duration-300 ${
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={isCollapsed}
      >
        {/* 크레딧 카드 */}
        <div className="ml-[20px] flex h-[80px] w-[200px] flex-col rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white pt-[8.5px] pr-[12.75px] pb-[8.5px] pl-[13.25px] select-none">
          <div className="flex items-center gap-1">
            <CreditIcon size={20} />
            <span className="text-[12px] leading-[24px] font-normal text-[#2F3440]">
              크레딧 <span className="text-[#2A6AFF]">{creditTotal}</span>
              <span className="text-[#9CA4B0]">/{creditMax}</span>
            </span>
          </div>

          <div className="ml-[24px] h-[5px] overflow-hidden rounded-full bg-[#E8ECF5]">
            <div
              className="h-full rounded-full bg-[#2A6AFF] transition-all duration-300"
              style={{ width: `${creditPercent}%` }}
            />
          </div>

          <div className="mt-[10px] flex items-center justify-between">
            <PlanBadge plan={planType} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpgradeClick();
              }}
              className="flex h-[24px] w-[88px] items-center justify-center rounded-[4px] border border-[#D1D6DE] bg-white px-[16px] text-[11px] leading-none font-semibold text-[#2F3440] transition-all hover:border-transparent hover:bg-[rgba(42,106,255,0.50)] hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white"
            >
              업그레이드
            </button>
          </div>
        </div>

        {/* 유저 행 - UserIcon은 absolute로 분리해 깜빡임 방지, 여기선 spacer만 */}
        <div
          className="ml-[18px] flex w-[200px] cursor-pointer items-center justify-between rounded-[12px] py-1 pr-2 transition-colors hover:bg-gray-100"
          onClick={onSettingsClick}
        >
          <div className="flex items-center gap-2">
            <div className="h-[40px] w-[40px] shrink-0" />
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

      {/* ── 접힌 상태 (크레딧 버튼만, UserIcon은 별도) ── */}
      <div
        className={`absolute bottom-0 left-0 flex w-[72px] flex-col pb-[76px] transition-opacity duration-300 ${
          isCollapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isCollapsed}
      >
        <div
          onClick={() => onToggle(false)}
          className="flex h-[26px] w-[60px] cursor-pointer items-center justify-center gap-[6px] self-center rounded-[8px] border-[0.5px] border-[#D1D6DE] px-[7px] py-[9px] shadow-sm transition-colors hover:bg-gray-50"
        >
          <CreditIcon size={22} />
          <span className="text-[10px] leading-none font-semibold text-[#2F3440]">
            {creditTotal}
          </span>
        </div>
      </div>

      {/* ── UserIcon 단독 고정 (opacity 전환 없이 항상 동일 위치) ── */}
      <button
        type="button"
        className="absolute bottom-[24px] left-[18px] cursor-pointer border-none bg-transparent p-0"
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
      <span className="inline-flex h-[20px] items-center gap-[4px] rounded-full bg-[#003880] px-2 text-[11px] leading-none font-semibold text-white">
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <defs>
            <linearGradient
              id="paint0_linear_447_8059"
              x1="3"
              y1="0"
              x2="3"
              y2="6"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop
                offset="1"
                stopColor="#2A6AFF"
              />
            </linearGradient>
          </defs>
          <path
            d="M3 0L0 3L3 6L6 3L3 0Z"
            fill="url(#paint0_linear_447_8059)"
          />
        </svg>
        Pro
      </span>
    );
  }
  if (plan === "Standard") {
    return (
      <span className="inline-flex h-[20px] items-center gap-[4px] rounded-full border border-[#2A6AFF] bg-[#2A6AFF] px-2 text-[11px] leading-none font-semibold text-white">
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M3 0L0 3L3 6L6 3L3 0Z"
            fill="white"
          />
        </svg>
        Std
      </span>
    );
  }
  return (
    <span className="inline-flex h-[20px] items-center rounded-full border border-[rgba(42,106,255,0.20)] px-2 text-[11px] leading-none font-semibold text-[#2F3440]">
      Free
    </span>
  );
};
