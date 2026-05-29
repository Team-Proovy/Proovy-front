import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogoIcon } from "@/shared/components/icons/LoginIcons";
import loginBgImage from "@/shared/assets/images/img_login_bg.png";
import type { SocialInfo } from "@/features/auth/api/auth_types";
import { signupComplete } from "@/features/auth/api/auth_api";
import { tokenUtils } from "@/shared/api/client";
import { AxiosError } from "axios";
import { useAuthStore } from "@/features/auth/store/auth_store";
import { showErrorToast } from "@/shared/lib/toast";

const REFERRAL_OPTIONS = [
  "검색 엔진 (네이버, 구글 등)",
  "AI 서비스 (ChatGPT, Claude, Gemini 등)",
  "SNS (인스타그램, X 등)",
  "에브리타임",
  "온라인 커뮤니티 및 블로그",
  "지인 추천",
  "기타",
];

export const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [referralDropUp, setReferralDropUp] = useState(false);
  const referralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        referralRef.current &&
        !referralRef.current.contains(e.target as Node)
      ) {
        setIsReferralOpen(false);
      }
    };
    if (isReferralOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isReferralOpen]);

  // KakaoCallbackPage에서 전달받은 signupToken
  const signupToken = location.state?.signupToken as string | undefined;

  useEffect(() => {
    // 회원가입 토큰이 없으면 (잘못된 접근) 로그인 페이지로 리다이렉트
    if (!signupToken) {
      navigate("/login", { replace: true });
    }
  }, [signupToken, navigate]);

  // 소셜 로그인 정보에서 이름 가져오기
  const initialName =
    (location.state?.kakaoInfo as SocialInfo)?.name ||
    (location.state?.naverInfo as SocialInfo)?.name ||
    "";

  const [formData, setFormData] = useState({
    name: initialName,
    nickname: "",
    department: "",
    referralSource: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupToken) return;

    setIsLoading(true);

    try {
      const response = await signupComplete({
        signupToken,
        name: formData.name,
        nickname: formData.nickname,
        department: formData.department,
        referralSource: formData.referralSource,
      });

      if (response.isSuccess) {
        const { token, user: signupUser } = response.result;
        tokenUtils.setTokens(token.accessToken, token.refreshToken);

        useAuthStore.getState().login({
          loginType: "LOGIN",
          token: token,
          user: {
            id: signupUser.userId,
            name: signupUser.name,
            nickname: signupUser.nickname,
            email: signupUser.email,
            profileImageUrl: signupUser.profileImageUrl,
          },
        });

        navigate("/app/home");
      } else {
        showErrorToast(`회원가입 실패: ${response.message}`);
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      const axiosError = error as AxiosError<{ message?: string }>;
      showErrorToast(
        axiosError.response?.data?.message ||
          "회원가입 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white select-none">
      {/* Background (Same as Login) */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        <img
          src={loginBgImage}
          alt="login background"
          className="absolute top-0 right-0 h-full w-auto object-cover"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex h-full w-full">
        {/* Aligned exactly like LoginPage */}
        <div
          className="flex h-full flex-1 items-center justify-start"
          style={{
            paddingLeft: "max(0px, min(120px, calc((100% - 600px) / 2)))",
          }}
        >
          <div
            className="flex flex-col items-center rounded-[20px] bg-[#F1F4F8] pt-[36px] pb-[44px]"
            style={{
              width: "min(600px, 100%)",
              height: "622px",
            }}
          >
            {/* Logo */}
            <div className="mb-[28px] flex items-center justify-center">
              <LogoIcon className="h-[35px] w-auto" />
            </div>

            <p className="mb-[16px] w-[392px] text-left font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.002px] text-[#000]">
              아래 항목을 입력해주세요.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col items-center"
            >
              {/* Name */}
              <div className="mb-[8px] flex w-[392px] flex-col gap-[4px]">
                <label className="font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.002px] text-[#000]">
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="이름을 입력해주세요"
                  disabled={!!initialName}
                  className={`flex h-[50px] w-full items-center rounded-[10px] border border-[#D1D6DE] px-[24px] py-[8px] text-[16px] outline-none placeholder:text-[#9CA4B0] focus:border-[#2A6AFF] ${
                    initialName ? "bg-[#F1F4F8] text-[#9CA4B0]" : "bg-white"
                  }`}
                />
              </div>

              {/* Nickname */}
              <div className="mb-[8px] flex w-[392px] flex-col gap-[4px]">
                <label className="font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.002px] text-[#000]">
                  닉네임
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="닉네임을 입력해주세요"
                  className="flex h-[50px] w-full items-center rounded-[10px] border border-[#D1D6DE] bg-white px-[24px] py-[8px] text-[16px] outline-none placeholder:text-[#9CA4B0] focus:border-[#2A6AFF]"
                />
              </div>

              {/* Department */}
              <div className="mb-[8px] flex w-[392px] flex-col gap-[4px]">
                <label className="font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.002px] text-[#000]">
                  학부/과
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="학부/과를 입력해주세요"
                  className="flex h-[50px] w-full items-center rounded-[10px] border border-[#D1D6DE] bg-white px-[24px] py-[8px] text-[16px] outline-none placeholder:text-[#9CA4B0] focus:border-[#2A6AFF]"
                />
              </div>

              {/* Referral Source */}
              <div className="flex w-[392px] flex-col gap-[4px]">
                <label className="font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.002px] text-[#000]">
                  해당 서비스를 알게 된 경로
                </label>
                <div
                  ref={referralRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!isReferralOpen && referralRef.current) {
                        const rect =
                          referralRef.current.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const estimatedHeight = REFERRAL_OPTIONS.length * 44;
                        setReferralDropUp(spaceBelow < estimatedHeight);
                      }
                      setIsReferralOpen((prev) => !prev);
                    }}
                    className={`flex h-[50px] w-full items-center justify-between rounded-[10px] border bg-white px-[24px] py-[8px] text-[16px] ${
                      isReferralOpen ? "border-[#2A6AFF]" : "border-[#D1D6DE]"
                    } ${formData.referralSource ? "text-black" : "text-[#9CA4B0]"}`}
                  >
                    <span>
                      {formData.referralSource || "알게 된 경로를 선택해주세요"}
                    </span>
                    <svg
                      width="12"
                      height="7"
                      viewBox="0 0 12 7"
                      fill="none"
                      className={`shrink-0 transition-transform duration-200 ${isReferralOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M1 1L6 6L11 1"
                        stroke="#9CA4B0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isReferralOpen && (
                    <div
                      className={`absolute left-0 z-20 w-full overflow-hidden rounded-[10px] border border-[#D1D6DE] bg-white shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] ${referralDropUp ? "bottom-full mb-1" : "top-full mt-1"}`}
                    >
                      {REFERRAL_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              referralSource: option,
                            }));
                            setIsReferralOpen(false);
                          }}
                          className={`w-full px-[24px] py-[10px] text-left text-[16px] transition-colors ${
                            formData.referralSource === option
                              ? "bg-[#F1F4F8] text-black"
                              : "text-black hover:bg-[#F1F4F8]"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.name ||
                  !formData.nickname ||
                  !formData.department ||
                  !formData.referralSource
                }
                className={`mt-[37px] h-[52px] w-[392px] rounded-[10px] text-[16px] font-semibold transition-all duration-200 ${
                  isLoading ||
                  !formData.name ||
                  !formData.nickname ||
                  !formData.department ||
                  !formData.referralSource
                    ? "cursor-not-allowed bg-[#E3E7ED] text-[#9CA4B0]"
                    : "cursor-pointer bg-[#2A6AFF] text-white hover:bg-[#1a5ae8] active:scale-[0.98] active:bg-[#003880]"
                } `}
              >
                {isLoading ? "처리 중..." : "가입 완료하기"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
