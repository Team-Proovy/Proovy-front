import { Link, useNavigate } from "react-router-dom";
import { ProovyLogo } from "@/shared/components/icons/ProovyLogo";

export const LandingHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 z-50 flex h-[80px] w-full items-center justify-between bg-white/80 px-[40px] backdrop-blur-md md:px-[92px]">
      <div className="flex items-center gap-[40px]">
        <Link
          to="/"
          className="flex items-center"
        >
          <ProovyLogo className="h-[25px] w-auto" />
        </Link>
        <nav className="hidden items-center gap-[32px] md:flex">
          <a
            href="/#intro"
            className="font-['Pretendard'] text-[18px] font-semibold text-black transition-colors hover:text-[#2A6AFF]"
          >
            소개
          </a>
          <a
            href="/#pricing"
            className="font-['Pretendard'] text-[18px] font-semibold text-black transition-colors hover:text-[#2A6AFF]"
          >
            요금제
          </a>
          <a
            href="/#faq"
            className="font-['Pretendard'] text-[18px] font-semibold text-black transition-colors hover:text-[#2A6AFF]"
          >
            Q&A
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-[16px]">
        <button
          onClick={() => navigate("/login")}
          className="flex h-[40px] items-center justify-center rounded-[10px] bg-[#F1F4F8] px-[34px] font-['Pretendard'] text-[14px] font-medium text-black transition-colors hover:bg-[#E3E7ED] active:bg-[#D1D6DE]"
        >
          로그인
        </button>
      </div>
    </header>
  );
};
