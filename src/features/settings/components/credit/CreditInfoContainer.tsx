import { useState } from "react";
import {
  CalendarIcon,
  CreditIcon,
} from "../../../../shared/components/icons/SettingsIcons";
import { UpgradeModal } from "../../../subscription/components/UpgradeModal";

interface CreditInfoContainerProps {
  plan: string;
  totalCredits: number;
  usedCredits: number;
  dailyCredits: number;
  dailyResetTime: string;
}

/**
 * 크레딧 정보 컨테이너 - 770x240
 * 크레딧 정보 + 일일 지급 크레딧을 하나의 컨테이너에 포함
 */
export const CreditInfoContainer = ({
  plan,
  totalCredits,
  usedCredits,
  dailyCredits,
  dailyResetTime,
}: CreditInfoContainerProps) => {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <>
      <div className="flex h-[240px] w-full flex-col rounded-[12px] bg-[#F1F4F8] px-[24px] py-[20px]">
        {/* 상단: 요금제 + 업그레이드 버튼 */}
        <div className="flex items-center justify-between">
          <span className="font-['Pretendard'] text-[16px] font-medium text-black">
            {plan}
          </span>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="h-[28px] w-[100px] cursor-pointer rounded-[18px] bg-[#2A6AFF] px-[16px] py-[4px] font-['Pretendard'] text-[14px] text-white transition-colors hover:bg-[#1a5ae8]"
          >
            업그레이드
          </button>
        </div>

        <div className="mt-[12px] h-[1px] bg-[#D1D6DE]" />

        {/* 크레딧 정보 */}
        <div className="mt-[19px] flex items-center justify-between">
          <div className="flex items-center gap-[4px]">
            <CreditIcon
              isActive={true}
              size={25}
            />
            <div className="flex flex-col">
              <span className="font-['Pretendard'] text-[14px] font-medium text-black">
                크레딧
              </span>
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
                무료 크레딧
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-['Pretendard'] text-[14px] font-medium text-black">
              {totalCredits.toLocaleString()}
            </span>
            <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
              {usedCredits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 일일 지급 크레딧 */}
        <div className="mt-[32px] flex items-start justify-between">
          <div className="flex items-center gap-[4px]">
            <CalendarIcon
              isActive={true}
              size={25}
            />
            <div className="flex flex-col">
              <span className="font-['Pretendard'] text-[14px] font-medium text-black">
                일일 지급 크레딧
              </span>
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
                {dailyResetTime}
              </span>
            </div>
          </div>
          <span className="font-['Pretendard'] text-[14px] font-medium text-black">
            {dailyCredits.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 업그레이드 모달 */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
};
