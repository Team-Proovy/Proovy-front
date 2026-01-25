import { useState } from "react";
import { LogoIcon } from "../../../shared/components/icons/LoginIcons";

// < 번호 인증 UI > 데모데이 전까지 비활성화

interface PhoneVerificationFormProps {
  onVerificationCodeSent?: (phoneNumber: string) => void;
  onCodeVerified?: (code: string) => void;
}

export const PhoneVerificationForm = ({
  onVerificationCodeSent,
  onCodeVerified,
}: PhoneVerificationFormProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<"phone" | "code">("phone");

  const handleSendCode = () => {
    if (phoneNumber.length === 11) {
      setIsCodeSent(true);
      onVerificationCodeSent?.(phoneNumber);
      setIsKeypadOpen(false);
    }
  };

  const handleVerifyCode = () => {
    onCodeVerified?.(verificationCode);
  };

  const handleKeypadPress = (digit: string) => {
    if (activeInput === "phone") {
      if (phoneNumber.length < 11) {
        setPhoneNumber((prev) => prev + digit);
      }
    } else {
      setVerificationCode((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    if (activeInput === "phone") {
      setPhoneNumber((prev) => prev.slice(0, -1));
    } else {
      setVerificationCode((prev) => prev.slice(0, -1));
    }
  };

  const renderKeypadToggleIcon = (isActive: boolean) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsKeypadOpen(!isKeypadOpen);
        if (!isKeypadOpen) {
          setActiveInput(
            isActive ? activeInput : activeInput === "phone" ? "phone" : "code",
          );
        }
      }}
      className={`absolute top-1/2 right-[16px] -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-gray-100 ${
        isKeypadOpen && isActive ? "text-[#2046FF]" : "text-[#D1D6DE]"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3ZM20 19H4V5H20V19ZM7 11H9V13H7V11ZM7 7H9V9H7V7ZM11 11H13V13H11V11ZM11 7H13V9H11V7ZM15 11H17V13H15V11ZM15 7H17V9H15V7ZM7 15H17V17H7V15Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );

  const renderNumericKeypad = () => (
    <div
      className="absolute bottom-[-10px] left-1/2 z-50 w-[280px] -translate-x-1/2 translate-y-full rounded-[20px] bg-white p-[20px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-3 gap-[10px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeypadPress(num.toString())}
            className="flex h-[40px] items-center justify-center rounded-[10px] bg-[#F1F4F8] font-['Pretendard'] text-[18px] font-medium text-[#2F3440] transition-all hover:bg-[#E3E7ED] active:scale-95"
          >
            {num}
          </button>
        ))}
        <div className="h-[40px]" />
        <button
          onClick={() => handleKeypadPress("0")}
          className="flex h-[40px] items-center justify-center rounded-[10px] bg-[#F1F4F8] font-['Pretendard'] text-[18px] font-medium text-[#2F3440] transition-all hover:bg-[#E3E7ED] active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleKeypadBackspace}
          className="flex h-[40px] items-center justify-center rounded-[10px] bg-[#F1F4F8] font-['Pretendard'] text-[#2F3440] transition-all hover:bg-[#E3E7ED] active:scale-95"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 4H8L1 12L8 20H21C22.1 20 23 19.1 23 18V6C23 4.9 22.1 4 21 4ZM21 18H8.83L3.58 12L8.83 6H21V18ZM19 9.41L17.59 8L15 10.59L12.41 8L11 9.41L13.59 12L11 14.59L12.41 16L15 13.41L17.59 16L19 14.59L16.41 12L19 9.41Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="relative flex h-screen w-full overflow-hidden bg-white select-none"
      onClick={() => setIsKeypadOpen(false)}
    >
      {/* 콘텐츠 레이어 */}
      <div className="relative z-10 flex h-full w-full">
        {/* 로그인 박스 영역: Figma 기준 좌측 120px 여백 (1440px 기준) - LoginPage와 동일하게 맞춤 */}
        <div
          className="flex h-full flex-1 items-center justify-center transition-all duration-300 ease-out md:justify-start"
          style={{
            paddingLeft:
              "clamp(0px, (100vw - 600px) * (120 / (1440 - 600)), 120px)",
          }}
        >
          <div
            className="flex flex-col items-center bg-[#F1F4F8]"
            style={{
              width: "600px",
              height: isCodeSent ? "523px" : "400px",
              padding: "72px 40px",
              borderRadius: "20px",
            }}
          >
            {/* Keypad */}
            {isKeypadOpen && renderNumericKeypad()}

            <div className="flex w-full flex-col">
              {/* 로고 영역 - Centered */}
              <div className="flex w-full justify-center">
                <LogoIcon className="h-[35px] w-auto text-black" />
              </div>

              {/* 제목 영역 - Left Aligned */}
              <h2 className="mt-[28px] text-left font-['Pretendard'] text-[18px] leading-[28px] font-semibold tracking-[-0.01em] text-black">
                휴대폰 번호로 인증하기
              </h2>

              {/* 폼 영역 */}
              <div className="mt-[28px] flex w-full flex-col items-start">
                {/* 휴대폰 번호 입력 칸 */}
                <div
                  className="relative w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phoneNumber}
                    onFocus={() => setActiveInput("phone")}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="휴대폰 번호 (- 없이 숫자만 입력)"
                    className="h-[50px] w-full rounded-[10px] border border-[#D1D6DE] bg-white px-[24px] py-[8px] font-['Pretendard'] text-[16px] leading-[24px] font-normal text-[#2F3440] outline-none placeholder:text-[#D1D6DE] focus:border-[#2046FF]"
                  />
                  {renderKeypadToggleIcon(activeInput === "phone")}
                </div>

                {/* 인증번호 받기 버튼 */}
                <button
                  onClick={handleSendCode}
                  disabled={phoneNumber.length !== 11}
                  className={`mt-[8px] flex h-[50px] w-full items-center justify-center rounded-[10px] font-['Pretendard'] text-[18px] leading-[28px] font-normal tracking-[-0.01em] transition-all duration-300 ease-in-out ${
                    phoneNumber.length === 11
                      ? "bg-[#E3E7ED] text-black hover:bg-[#2A6AFF] hover:text-white active:bg-[#003880] active:text-white active:duration-100"
                      : "cursor-not-allowed bg-[#E3E7ED] text-[#D1D6DE]"
                  }`}
                >
                  인증번호 받기
                </button>

                {!isCodeSent ? (
                  <p className="mt-[8px] font-['Pretendard'] text-[13px] leading-[18px] font-normal text-[#2F3440]">
                    *계정에 암호화된 정보만 기록되며, 번호는 서버에 남지
                    않습니다.
                  </p>
                ) : (
                  <div
                    className="mt-[28px] w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative w-full">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={verificationCode}
                        onFocus={() => setActiveInput("code")}
                        onChange={(e) =>
                          setVerificationCode(
                            e.target.value.replace(/[^0-9]/g, ""),
                          )
                        }
                        placeholder="인증번호 입력"
                        className="h-[50px] w-full rounded-[10px] border border-[#D1D6DE] bg-white px-[24px] py-[8px] font-['Pretendard'] text-[16px] leading-[24px] font-normal text-[#2F3440] outline-none placeholder:text-[#D1D6DE] focus:border-[#2046FF]"
                      />
                      {renderKeypadToggleIcon(activeInput === "code")}
                    </div>
                  </div>
                )}

                {/* 다음으로 넘어가기 버튼 */}
                {isCodeSent && (
                  <div className="mt-[36px] w-full">
                    <button
                      onClick={handleVerifyCode}
                      className="flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[#E3E7ED] font-['Pretendard'] text-[18px] leading-[28px] font-normal tracking-[-0.01em] text-black transition-colors duration-300 ease-in-out hover:bg-[#2A6AFF] hover:text-white active:bg-[#003880] active:text-white active:duration-100"
                    >
                      다음으로 넘어가기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배경 이미지 레이어 - LoginPage와 동일 */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
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
