import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[800px] w-full flex-col items-center justify-center pt-[80px]">
      {/* Background Gradient Blur */}
      <div className="absolute top-[200px] left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#2A6AFF]/10 blur-[120px]" />

      <div className="text-center">
        <h1 className="font-['Pretendard'] text-[36px] leading-[1.4] font-bold text-black md:text-[48px]">
          이공계 대학생을 위한
          <br />
          퍼스널 AI 튜터
        </h1>
        <p className="mt-[24px] font-['Pretendard'] text-[18px] leading-[1.6] text-gray-600">
          프루비는 무료로 시작할 수 있습니다.
          <br />
          당신의 필요에 가장 잘 맞는 요금제를 선택하세요!
        </p>

        <div className="mt-[48px] flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="flex h-[52px] w-[280px] items-center justify-center rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[20px] font-semibold text-black shadow-sm transition-all hover:bg-gray-50 active:bg-gray-100"
          >
            Proovy 시작하기
          </button>
        </div>
      </div>

      {/* Down Arrow / Indicator */}
      <div className="absolute bottom-[40px] flex flex-col items-center gap-2">
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
      </div>
    </section>
  );
};
