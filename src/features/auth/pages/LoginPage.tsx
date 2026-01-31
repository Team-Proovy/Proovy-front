import { useNavigate } from "react-router-dom";
import {
  LogoIcon,
  KakaoIcon,
  NaverIcon,
  GoogleIcon,
} from "../../../shared/components/icons/LoginIcons";
import { SocialLoginButton } from "../components/SocialLoginButton";
import loginBgImage from "../../../shared/assets/images/img_login_bg.png";

export const LoginPage = () => {
  const navigate = useNavigate();

  // TODO: 실제 OAuth 로그인 로직으로 교체 예정
  const handleSocialLogin = () => {
    // 임시: 바로 홈으로 이동
    navigate("/app/home");
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white select-none">
      {/* 콘텐츠 레이어 */}
      <div className="relative z-10 flex h-full w-full">
        {/* 로그인 박스 영역: CSS calc를 이용한 끊김 없는 위치 전환 (중앙 <-> 좌측 120px) */}
        <div
          className="flex h-full flex-1 items-center justify-start"
          style={{
            paddingLeft: "max(0px, min(120px, calc((100% - 600px) / 2)))",
          }}
        >
          <div
            className="flex flex-col items-center justify-center bg-[#F5F5F5] transition-all duration-100 ease-linear"
            style={{
              width: "min(600px, 100%)",
              padding: "0 40px",
              height: "400px",
              borderRadius: "20px",
            }}
          >
            <div className="flex w-full max-w-[403px] flex-col items-center justify-center gap-[50px]">
              {/* 상단 로고 및 텍스트 영역 */}
              <div className="flex flex-col items-center gap-[5px]">
                <div className="flex items-center gap-[4px]">
                  <LogoIcon className="h-[35px] w-auto" />
                  <span className="mt-1 font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.01em] text-[#000000]">
                    에 로그인
                  </span>
                </div>
                <p className="text-center font-['Pretendard'] text-[16px] leading-[24px] font-normal text-[#000000]">
                  소셜 로그인을 통해 프루비를 사용할 수 있습니다.
                </p>
              </div>

              {/* 하단 버튼 영역 */}
              <div className="flex w-full flex-col gap-[6px]">
                <SocialLoginButton
                  provider="kakao"
                  icon={<KakaoIcon className="h-[18px] w-[20px]" />}
                  label="카카오 로그인"
                  onClick={handleSocialLogin}
                />
                <SocialLoginButton
                  provider="naver"
                  icon={<NaverIcon className="h-[16px] w-[16px]" />}
                  label="네이버 로그인"
                  onClick={handleSocialLogin}
                />
                <SocialLoginButton
                  provider="google"
                  icon={<GoogleIcon className="h-[24px] w-[24px]" />}
                  label="구글 로그인"
                  onClick={handleSocialLogin}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배경 이미지 레이어 */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        <img
          src={loginBgImage}
          alt="login background"
          className="absolute top-0 right-0 h-full w-auto object-cover"
        />
      </div>
    </div>
  );
};
