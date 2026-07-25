import { ProovyIcon } from "@/shared/components/icons/ProovyIcon";

/**
 * 최상단 ErrorBoundary 폴백.
 *
 * 라우터 바깥(provider 등)에서 터진 catastrophic 에러용이라
 * 라우터 컨텍스트가 없을 수 있어 SPA 네비게이션 대신 window.location을 사용한다.
 */
export const RootErrorFallback = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <ProovyIcon className="h-40 w-40" />

        <p className="mt-12 font-[Pretendard] text-[32px] font-semibold text-black">
          문제가 발생했습니다
        </p>
        <p className="mt-4 max-w-[420px] text-center font-[Pretendard] text-[16px] leading-[26px] text-black">
          예기치 못한 오류로 화면을 표시할 수 없습니다.
          <br />
          페이지를 새로고침해 주세요.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-12 flex h-[52px] w-[280px] items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-[Pretendard] text-[20px] font-semibold text-black transition-all duration-300 hover:border-transparent hover:text-[#2A6AFF] hover:shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)] active:border-transparent active:bg-[#2A6AFF] active:text-white"
        >
          새로고침
        </button>
      </div>
    </div>
  );
};
