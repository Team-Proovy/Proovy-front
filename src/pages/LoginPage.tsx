import { LogoIcon, KakaoIcon, NaverIcon, GoogleIcon } from "../shared/ui/Icons";
import { SocialLoginButton } from "../shared/ui/SocialLoginButton";

export const LoginPage = () => {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white font-['Pretendard'] select-none">
      {/* 콘텐츠 레이어 */}
      <div className="relative z-10 flex h-full w-full">
        {/* 로그인 박스 영역 */}
        <div className="flex min-w-[600px] flex-1 items-center justify-center">
          <div
            className="flex shrink-0 flex-col items-center justify-center bg-[#F5F5F5] transition-all duration-100 ease-linear"
            style={{
              width: "600px",
              padding: "0 40px",
              height:
                "clamp(400px, calc(400px + (1400px - 100vw) * 1.5), 100vh)",
              borderRadius: "clamp(0px, (100vw - 1100px) * 0.2, 20px)",
            }}
          >
            <div className="flex w-[403px] flex-col items-center justify-center gap-[50px]">
              {/* 상단 로고 및 텍스트 영역 */}
              <div
                className="flex flex-col justify-between"
                style={{ width: "310px", height: "64px" }}
              >
                <div className="flex items-center justify-center gap-1">
                  <LogoIcon className="h-[35px] w-auto" />
                  <span className="mt-2 font-['Pretendard'] text-[18px] leading-6 font-semibold tracking-[-0.01em] text-[#000000]">
                    에 로그인
                  </span>
                </div>
                <p className="text-center font-['Pretendard'] text-[16px] leading-6 font-normal text-[#000000]">
                  소셜 로그인을 통해 프루비를 사용할 수 있습니다.
                </p>
              </div>

              {/* 하단 버튼 영역 */}
              <div
                className="flex flex-col gap-[4px]"
                style={{ width: "403px", height: "170px" }}
              >
                <SocialLoginButton
                  provider="kakao"
                  icon={<KakaoIcon className="h-[18px] w-[18px]" />}
                  label="카카오 로그인"
                />
                <SocialLoginButton
                  provider="naver"
                  icon={<NaverIcon className="h-[16px] w-[16px]" />}
                  label="네이버 로그인"
                />
                <SocialLoginButton
                  provider="google"
                  icon={<GoogleIcon className="h-[24px] w-[24px]" />}
                  label="구글 로그인"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 빈 공간 (Spacer) */}
        <div className="w-[43%] shrink transition-[width] duration-300 ease-out" />
      </div>

      {/* 배경 이미지 레이어 */}
      <div
        className="pointer-events-none absolute top-0 right-0 z-0 h-full"
        style={{
          width: "100%",
        }}
      >
        <div
          className="h-full w-full bg-no-repeat"
          style={{
            backgroundImage:
              "url('/src/shared/assets/images/img_login_bg.png')",
            backgroundSize: "auto 100%",
            backgroundPosition: "right center",
          }}
        />
      </div>
    </div>
  );
};
