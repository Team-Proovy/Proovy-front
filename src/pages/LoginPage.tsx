import icLogo from "../shared/assets/icons/ic_logo.svg";
import icKakao from "../shared/assets/icons/ic_kakao.svg";
import icNaver from "../shared/assets/icons/ic_naver.svg";
import icGoogle from "../shared/assets/icons/ic_google.svg";

export const LoginPage = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-['Pretendard'] select-none">
      {/* 1. 왼쪽 로그인 영역 */}
      <div className="flex flex-[57] items-center justify-center">
        <div
          className="flex shrink-0 flex-col items-center justify-center rounded-[32px] bg-[#F5F5F5]"
          style={{
            width: "600px",
            height: "400px",
            padding: "0 40px",
          }}
        >
          <div
            className="flex flex-col items-center justify-between"
            style={{ width: "403px", height: "284px" }}
          >
            {/* 로고 영역 */}
            <div
              className="flex flex-col justify-between"
              style={{ width: "310px", height: "64px" }}
            >
              <div className="flex items-center justify-center gap-1">
                <img
                  src={icLogo}
                  alt="Logo"
                  className="h-[35px] w-auto"
                />
                <span className="mt-2 text-[18px]/[28px] font-semibold tracking-[-0.01em] text-[#000000]">
                  에 로그인
                </span>
              </div>

              <p className="text-center text-[16px]/[24px] font-normal tracking-normal text-[#000000]">
                소셜 로그인을 통해 프루비를 사용할 수 있습니다.
              </p>
            </div>

            {/* 2. 버튼 영역 */}
            <div
              className="flex flex-col gap-[3px]"
              style={{
                width: "403px",
                height: "170px",
                opacity: 1,
              }}
            >
              {/* 카카오 버튼 */}
              <button className="flex h-[54px] w-full items-center justify-center rounded-[10px] border-none bg-[#FEE500] text-[16px] text-[#191919] outline-none">
                <div className="flex w-full items-center justify-center gap-3">
                  <img
                    src={icKakao}
                    alt="Kakao logo"
                    className="h-[18px] w-[18px]"
                  />
                  <span className="mt-[2px] leading-none">카카오 로그인</span>
                </div>
              </button>

              {/* 네이버 버튼 */}
              <button className="flex h-[54px] w-full items-center justify-center rounded-[10px] border-none bg-[#03C75A] text-[16px] text-[#FFFFFF] outline-none">
                <div className="flex w-full items-center justify-center gap-3">
                  <img
                    src={icNaver}
                    alt="Naver logo"
                    className="h-[16px] w-[16px]"
                  />
                  <span className="mt-[2px] leading-none">네이버 로그인</span>
                </div>
              </button>

              {/* 구글 버튼 */}
              <button className="flex h-[54px] w-full items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white text-[16px] text-[#0000008A] outline-none">
                <div className="flex w-full items-center justify-center gap-3">
                  <img
                    src={icGoogle}
                    alt="Google logo"
                    className="h-[24px] w-[24px]"
                  />
                  <span className="mt-[2px] leading-none">구글 로그인</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 오른쪽 배경 영역 */}
      <div
        className="flex flex-[43] bg-no-repeat"
        style={{
          backgroundImage: "url('/src/shared/assets/images/img_login_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
};
