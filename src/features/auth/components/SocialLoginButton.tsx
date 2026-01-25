import type { ReactNode } from "react";

interface SocialLoginButtonProps {
  icon: ReactNode;
  label: string;
  provider: "kakao" | "naver" | "google";
  onClick?: () => void;
}

export const SocialLoginButton = ({
  icon,
  label,
  provider,
  onClick,
}: SocialLoginButtonProps) => {
  // 프로바이더별 기본 스타일 설정
  const baseStyles = {
    kakao: "bg-[#FEE500] text-[#000000] border-none",
    naver: "bg-[#03C75A] text-[#FFFFFF] border-none",
    google: "bg-white text-[#0000008A] border border-[#E2E8F0]",
  };

  // 프로바이더별 gap 스타일 설정
  const gapStyles = {
    kakao: "gap-[16px]",
    naver: "gap-[15px]",
    google: "gap-[24px]",
  };

  return (
    <button
      onClick={onClick}
      className={`group flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[10px] text-[18px] transition-colors duration-300 ease-in-out outline-none hover:border-transparent hover:bg-[#2A6AFF] hover:text-white active:bg-[#003880] active:text-white active:duration-100 ${baseStyles[provider]} `}
    >
      <div
        className={`flex w-full items-center justify-center ${gapStyles[provider]}`}
      >
        <div className="flex items-center justify-center transition-colors duration-300 group-hover:text-white">
          {icon}
        </div>
        <span className="mt-[2px] leading-[28px] font-normal">{label}</span>
      </div>
    </button>
  );
};
