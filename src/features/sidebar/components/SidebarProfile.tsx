import {
  UserIcon,
  SettingIcon,
  CreditIcon,
} from "../../../shared/components/icons/SidebarIcons";

import { useState, useId, useEffect } from "react";
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
  const barId = useId();
  const progressWidth = Math.round((creditPercent / 100) * 140);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setAnimatedWidth(progressWidth), 50);
    return () => clearTimeout(id);
  }, [progressWidth]);

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
        <div className="ml-[20px] flex h-[80px] w-[200px] flex-col items-center justify-center gap-[10px] rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[rgba(255,255,255,0.70)] py-[6px] pr-[12.75px] pl-[13.25px] select-none">
          {/* 크레딧 아이콘 + 텍스트 + 프로그레스 바 */}
          <div className="flex w-full flex-col">
            <div className="flex items-start gap-[8px]">
              <CreditIcon
                className="translate-y-[3px] transform"
                size={25}
              />
              <span className="text-[12px] leading-[24px] font-normal text-[#2F3440]">
                크레딧 <span className="text-[#2A6AFF]">{creditTotal}</span>
                <span className="text-[#9CA4B0]">/{creditMax}</span>
              </span>
            </div>
            <svg
              className="ml-[33px]"
              width="140"
              height="7"
              viewBox="0 0 140 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter
                  id={`${barId}-track`}
                  x="0"
                  y="1"
                  width="141"
                  height="6"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="BackgroundImageFix"
                    result="shape"
                  />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset
                    dx="1"
                    dy="1"
                  />
                  <feGaussianBlur stdDeviation="0.5" />
                  <feComposite
                    in2="hardAlpha"
                    operator="arithmetic"
                    k2="-1"
                    k3="1"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="shape"
                    result="effect1_innerShadow"
                  />
                </filter>
                <filter
                  id={`${barId}-progress`}
                  x="0"
                  y="0"
                  width="142"
                  height="7"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dx="1" />
                  <feGaussianBlur stdDeviation="0.5" />
                  <feComposite
                    in2="hardAlpha"
                    operator="out"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow"
                    result="shape"
                  />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset
                    dx="1"
                    dy="1"
                  />
                  <feGaussianBlur stdDeviation="0.5" />
                  <feComposite
                    in2="hardAlpha"
                    operator="arithmetic"
                    k2="-1"
                    k3="1"
                  />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="shape"
                    result="effect2_innerShadow"
                  />
                </filter>
              </defs>
              <g filter={`url(#${barId}-track)`}>
                <rect
                  y="1"
                  width="140"
                  height="5"
                  rx="2.5"
                  fill="#D1D6DE"
                />
              </g>
              <g filter={`url(#${barId}-progress)`}>
                <rect
                  y="1"
                  height="5"
                  rx="2.5"
                  fill="#2A6AFF"
                  style={{
                    width: animatedWidth,
                    transition: "width 0.35s ease-out",
                  }}
                />
              </g>
            </svg>
          </div>

          {/* 플랜 배지 + 업그레이드 버튼 */}
          <div className="flex w-full items-center justify-between">
            <PlanBadge plan={planType} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpgradeClick();
              }}
              className="flex h-[24px] w-[115px] shrink-0 items-center justify-center rounded-[4px] border-[0.5px] border-[#D1D6DE] bg-white px-[16px] text-[11px] leading-none font-semibold text-[#2F3440] transition-all hover:border-transparent hover:bg-[rgba(42,106,255,0.50)] hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white"
            >
              업그레이드
            </button>
          </div>
        </div>

        {/* 유저 행 - UserIcon은 absolute로 분리해 깜빡임 방지, 여기선 spacer만 */}
        <div
          className="ml-[20px] flex w-[200px] cursor-pointer items-center justify-between rounded-[12px] py-1 transition-colors hover:bg-gray-100"
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
        className="absolute bottom-[24px] left-[16px] cursor-pointer border-none bg-transparent p-0"
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
      <span className="inline-flex items-center gap-[4px] rounded-[20px] bg-[#003880] px-[8px]">
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
              id="pro-badge-grad"
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
            fill="url(#pro-badge-grad)"
          />
        </svg>
        <span className="w-[21px] text-center text-[10px] leading-[24px] font-bold text-white">
          Pro
        </span>
      </span>
    );
  }
  if (plan === "Standard") {
    return (
      <span className="inline-flex items-center gap-[4px] rounded-[20px] border border-[#2A6AFF] bg-[#2A6AFF] px-[8px]">
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
        <span className="w-[21px] text-center text-[10px] leading-[24px] font-bold text-white">
          Std
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[4px] rounded-[20px] border border-[rgba(42,106,255,0.20)] px-[8px]">
      <span className="w-[21px] text-center text-[10px] leading-[24px] font-bold text-[#003880]">
        Free
      </span>
    </span>
  );
};
