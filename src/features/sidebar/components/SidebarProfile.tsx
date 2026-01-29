// 이 컴포넌트는 사이드바의 최하단 영역인 프로필, 요금제 정보, 설정 버튼 등을 담당합니다.
import {
  UserIcon,
  SettingIcon,
  CreditIcon,
  PaperIcon,
} from "../../../shared/components/icons/SidebarIcons";

interface SidebarProfileProps {
  isCollapsed: boolean;
  onUpgradeClick: () => void;
  onSettingsClick: () => void;
}

export const SidebarProfile = ({
  isCollapsed,
  onUpgradeClick,
  onSettingsClick,
}: SidebarProfileProps) => {
  return !isCollapsed ? (
    /* 펼쳐진 상태의 프로필 UI */
    <div className="w-[240px] shrink-0 space-y-4 px-[20px] pt-4 pb-[20px]">
      <div className="space-y-4 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white p-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[#2A6AFF]" />
            <span className="text-[14px] leading-[20px] font-medium text-[#333333]">
              Free
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpgradeClick();
            }}
            className="flex h-[24px] w-[88px] items-center justify-center rounded bg-[#2A6AFF] text-[14px] leading-none text-white transition-colors hover:bg-[#2A6AFF]/50 active:bg-white active:text-black"
          >
            업그레이드
          </button>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-1.5">
            <CreditIcon />
            <span className="text-[#D1D6DE text-[14px] font-medium">200</span>
          </div>
          <div className="mr-[24px] flex items-center gap-1.5">
            <PaperIcon />
            <span className="text-[14px] font-medium">5/5</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <UserIcon size={38} />
          <span className="text-[20px] font-semibold">닉네임</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }}
          className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
        >
          <SettingIcon
            size={20}
            className="cursor-pointer text-gray-400"
          />
        </button>
      </div>
    </div>
  ) : (
    /* 접힌 상태의 프로필 UI */
    <div className="flex w-[80px] shrink-0 flex-col items-center gap-[12px] pb-[23px]">
      <div className="flex h-[26px] w-[60px] items-center justify-center gap-[6px] rounded-[8px] border-[0.5px] border-[#D1D6DE] px-[7px] py-[9px] shadow-sm">
        <CreditIcon size={22} />
        <span className="text-[10px] font-semibold text-[#2F3440]">200</span>
      </div>
      <UserIcon size={40} />
    </div>
  );
};
