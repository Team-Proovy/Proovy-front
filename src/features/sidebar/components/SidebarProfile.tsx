// 이 컴포넌트는 사이드바의 최하단 영역인 프로필, 요금제 정보, 설정 버튼 등을 담당합니다.
import {
  UserIcon,
  SettingIcon,
  CreditIcon,
  PaperIcon,
} from "../../../shared/components/icons/SidebarIcons";

import { useAuthStore } from "../../auth/store/auth_store";
import { useNoteList } from "@/features/notes/hooks/useNotes";
import { useMyProfile } from "@/features/settings/hooks/useUser";
import {
  getPlanMaxNotes,
  normalizePlanType,
} from "@/features/subscription/types/plan_types";

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
  const authUser = useAuthStore((state) => state.user);
  const { data: profile } = useMyProfile();
  const { data: noteListData } = useNoteList({
    page: 0,
    size: 1,
  });

  const planType = normalizePlanType(
    profile?.subscription?.plan ?? authUser?.plan,
  );
  const maxNotes = getPlanMaxNotes(planType);
  const totalNotes = noteListData?.pageInfo.totalElements ?? 0;
  const creditTotal = profile?.credit.totalAvailable ?? 0;

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
  // 플랜별 인디케이터 색상 (Free < Standard < Pro 순으로 진하게)
  const getPlanIndicatorColor = (plan: string) => {
    switch (plan) {
      case "Pro":
        return "bg-[#2A6AFF]";
      case "Standard":
        return "bg-[#6B9EFF]";
      case "Free":
      default:
        return "bg-[#B3CCFF]";
    }
  };

  return !isCollapsed ? (
    <div className="w-[240px] shrink-0 space-y-4 px-[20px] pt-4 pb-[20px]">
      <div className="space-y-4 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white p-3 text-xs select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <div className="flex w-[24px] justify-center">
              <div
                className={`h-[8px] w-[8px] rounded-full ${getPlanIndicatorColor(
                  planType,
                )}`}
              />
            </div>
            <span className="text-[14px] leading-[20px] font-medium text-[#333333]">
              {planType}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (authUser?.plan !== "Pro") {
                onUpgradeClick();
              }
            }}
            className={`flex h-[24px] w-[70px] cursor-pointer items-center justify-center rounded bg-[#2A6AFF] text-[12px] leading-none text-white transition-colors ${
              authUser?.plan === "Pro"
                ? "cursor-default opacity-50"
                : "hover:bg-[#2A6AFF]/50 active:bg-white active:text-black"
            }`}
            disabled={authUser?.plan === "Pro"}
          >
            {authUser?.plan === "Pro" ? "최고 플랜" : "업그레이드"}
          </button>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-1.5">
            <CreditIcon />
            <span className="text-[14px] font-medium text-[#333333]">
              {creditTotal}
            </span>
          </div>
          <div className="flex w-[70px] items-center gap-1.5">
            <PaperIcon />
            <div className="text-[14px] font-medium">
              <span className="text-[#333333]">{totalNotes}</span>
              <span className="text-[#9CA4B0]">/{maxNotes}</span>
            </div>
          </div>
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
      <UserIcon
        onClick={(e) => {
          e.stopPropagation();
          onSettingsClick();
        }}
        size={40}
        className="cursor-pointer"
      />
    </div>
  );
};
