import { useNavigate, useLocation } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handlePricingClick = () => {
    const isFromApp = location.pathname.startsWith("/app");
    navigate("/pricing", { state: { from: isFromApp ? "home" : "landing" } });
  };

  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-white from-5% via-[#F0F6FF] via-50% to-white to-95% px-[20px] py-[60px] md:flex-row md:px-[92px] md:py-[100px]">
      <div className="z-10 flex flex-col items-center text-center md:max-w-[500px] md:items-start md:text-left">
        <h2 className="font-['Pretendard'] text-[32px] leading-[1.3] font-bold text-black md:text-[42px]">
          플랜별 기능 차이를
          <br />
          확인해보세요.
        </h2>
        <p className="mt-[24px] font-['Pretendard'] text-[17px] leading-[1.6] font-medium text-[#4B5563] md:text-[20px]">
          작업량과 목적에 맞는 최적의 플랜을 선택하고
          <br className="md:hidden" /> 더욱 스마트하게 학습하세요.
        </p>

        <button
          onClick={handlePricingClick}
          className="mt-[48px] flex h-[52px] w-[280px] items-center justify-center rounded-[12px] border-[0.5px] border-solid border-[#D1D6DE] bg-white font-['Pretendard'] text-[20px] font-semibold text-black transition-all hover:bg-gray-50 active:scale-95"
        >
          요금제 확인하기
        </button>
      </div>

      <div className="relative mt-[80px] flex w-full max-w-full justify-center md:mt-0 md:justify-end">
        {/* Maximum iPad Illustration enlargement */}
        <div className="relative aspect-[16/11] w-full max-w-[700px] scale-120 md:scale-140">
          <img
            src="/landing/pricing_ipad.png"
            alt="Pricing Table on iPad"
            className="h-full w-full object-contain"
          />
          {/* Performance-optimized glow effect */}
          <div className="absolute top-1/2 left-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2A6AFF]/10 blur-[60px]" />
        </div>
      </div>
    </section>
  );
};
