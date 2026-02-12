import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex w-full flex-col items-start justify-center overflow-hidden bg-white px-[20px] py-[120px] md:flex-row md:items-center md:px-[92px]">
      <div className="z-10 flex flex-col items-center text-center md:items-start md:text-left">
        <h2 className="font-['Pretendard'] text-[32px] leading-[1.3] font-bold text-black md:text-[36px]">
          플랜별 기능 차이를
          <br />
          확인해보세요.
        </h2>
        <p className="mt-[20px] font-['Pretendard'] text-[16px] leading-[1.6] text-black md:text-[18px]">
          작업량과 목적에 맞는 최적의 플랜을 선택하세요.
        </p>

        <button
          onClick={() => navigate("/pricing")}
          className="mt-[40px] flex h-[52px] w-[280px] items-center justify-center rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[20px] font-semibold text-black transition-all hover:bg-gray-50 active:bg-gray-100"
        >
          요금제 확인하기
        </button>
      </div>

      <div className="mt-[60px] flex w-full justify-center md:mt-0 md:justify-end">
        {/* Large iPad/Device illustration mockup could go here */}
        <div className="relative h-[300px] w-full max-w-[600px] rounded-[30px] bg-gradient-to-br from-[#F4F7FF] to-[#2A6AFF]/10 p-8 shadow-2xl md:h-[450px]">
          <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-white text-gray-300 shadow-inner">
            [Illustration: Plan Comparison Preview]
          </div>
          {/* Subtle glow effect */}
          <div className="absolute -right-20 -bottom-20 -z-10 h-[300px] w-[300px] rounded-full bg-[#2A6AFF]/20 blur-[100px]" />
        </div>
      </div>
    </section>
  );
};
