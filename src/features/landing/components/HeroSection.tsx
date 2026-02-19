import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center pt-[120px] pb-[100px] md:pt-[160px] md:pb-[180px]">
      <div className="absolute top-[200px] left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#2A6AFF]/8 blur-[80px]" />

      <div className="text-center">
        <h1 className="font-['Pretendard'] text-[36px] leading-[1.4] font-bold text-black md:text-[48px]">
          이공계 대학생을 위한
          <br />
          쉽게 묻고 믿을 수 있는 AI 튜터
        </h1>

        <div className="mt-[48px] flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="flex h-[52px] w-full max-w-[280px] items-center justify-center rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[20px] font-semibold text-black shadow-sm transition-all hover:bg-gray-50 active:bg-gray-100"
          >
            Proovy 시작하기
          </button>
        </div>
      </div>

      <a
        href="#intro"
        className="absolute bottom-[24px] flex flex-col items-center gap-2 transition-all hover:translate-y-1 hover:opacity-80 active:opacity-60 md:bottom-[48px]"
      >
        <span className="font-['Pretendard'] text-[18px] font-semibold text-[#6B7280]">
          내려서 확인하기
        </span>
        <svg
          width="28"
          height="16"
          viewBox="0 0 28 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#6B7280]"
        >
          <path
            d="M2 2L14 14L26 2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
};
