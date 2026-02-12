import { useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  CreditIcon,
} from "../../../../shared/components/icons/SettingsIcons";

interface CreditInfoContainerProps {
  plan: string;
  monthlyCreditBalance: number;
  monthlyCreditLimit: number;
  dailyCreditBalance: number;
  dailyCreditLimit: number;
  dailyResetTime: string;
}

/**
 * 크레딧 정보 컨테이너 - 770x240
 * 월간 크레딧 + 일일 크레딧 정보 표시
 */
export const CreditInfoContainer = ({
  plan,
  monthlyCreditBalance,
  monthlyCreditLimit,
  dailyCreditBalance,
  dailyCreditLimit,
  dailyResetTime,
}: CreditInfoContainerProps) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex h-auto w-full flex-col rounded-[12px] bg-[#F1F4F8] px-[24px] py-[20px]">
        {/* 상단: 요금제 + 업그레이드 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <span className="font-['Pretendard'] text-[16px] font-medium text-black">
              {plan}
            </span>
            <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
              일일 크레딧 사용 이후 월간 크레딧으로 전환됩니다.
            </span>
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="h-[28px] w-[100px] cursor-pointer rounded-[18px] border-[0.5px] border-[#D1D6DE] bg-transparent px-[16px] py-[4px] font-['Pretendard'] text-[14px] text-black transition-colors hover:border-transparent hover:bg-[#2A6AFF] hover:text-white active:bg-[#1A5AE8] active:text-white"
          >
            {plan === "Pro" ? "현재 플랜" : "업그레이드"}
          </button>
        </div>

        <div className="mt-[12px] h-[1px] bg-[#D1D6DE]" />

        {/* 월간 크레딧 정보 */}
        <div className="mt-[19px] flex items-center justify-between">
          <div className="flex items-center gap-[4px]">
            <CreditIcon
              isActive={true}
              size={25}
            />
            <div className="flex flex-col">
              <span className="font-['Pretendard'] text-[14px] font-medium text-black">
                월간 크레딧
              </span>
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
                이번 달 사용 가능
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-['Pretendard'] text-[14px] font-medium text-black">
              {monthlyCreditBalance.toLocaleString()}
            </span>
            <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
              / {monthlyCreditLimit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 일일 지급 크레딧 */}
        <div className="mt-[20px] flex items-start justify-between">
          <div className="flex items-center gap-[4px]">
            <CalendarIcon
              isActive={true}
              size={25}
            />
            <div className="flex flex-col">
              <span className="font-['Pretendard'] text-[14px] font-medium text-black">
                일일 크레딧
              </span>
              <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
                {dailyResetTime}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-['Pretendard'] text-[14px] font-medium text-black">
              {dailyCreditBalance.toLocaleString()}
            </span>
            <span className="font-['Pretendard'] text-[12px] font-medium text-[#9CA4B0]">
              / {dailyCreditLimit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
