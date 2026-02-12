import { ProovyLogo } from "@/shared/components/icons/ProovyLogo";

export const LandingFooter = () => {
  return (
    <footer className="w-full bg-[#FAFAFA] px-[20px] py-[60px] md:px-[92px]">
      <div className="flex flex-col items-center justify-between gap-[40px] md:flex-row md:items-start">
        <div className="flex flex-col items-center md:items-start">
          <ProovyLogo className="h-[24px] w-auto opacity-50 grayscale" />
          <p className="mt-[20px] font-['Pretendard'] text-[14px] text-gray-400">
            © 2026 Proovy. All rights reserved.
          </p>
        </div>

        <div className="flex gap-[60px]">
          <div className="flex flex-col gap-[12px]">
            <span className="font-['Pretendard'] text-[16px] font-semibold text-gray-800">
              서비스
            </span>
            <a
              href="#"
              className="font-['Pretendard'] text-[14px] text-gray-500 hover:text-black"
            >
              소개
            </a>
            <a
              href="/#pricing"
              className="font-['Pretendard'] text-[14px] text-gray-500 hover:text-black"
            >
              요금제
            </a>
          </div>
          <div className="flex flex-col gap-[12px]">
            <span className="font-['Pretendard'] text-[16px] font-semibold text-gray-800">
              문의
            </span>
            <a
              href="mailto:proovy2611@gmail.com"
              className="font-['Pretendard'] text-[14px] text-gray-500 hover:text-black"
            >
              proovy2611@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
