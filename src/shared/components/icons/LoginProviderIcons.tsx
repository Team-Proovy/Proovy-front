/**
 * 로그인 제공자별 프로필 아이콘
 * - 카카오, 구글, 네이버 로그인 아이콘
 * - 크기: 100x100px, 원형
 */

export type LoginProvider = "kakao" | "google" | "naver";

interface LoginProviderIconProps {
  provider: LoginProvider;
  size?: number;
  className?: string;
}

/**
 * 로그인 제공자에 따른 프로필 아이콘
 */
export const LoginProviderIcon = ({
  provider,
  size = 100,
  className = "",
}: LoginProviderIconProps) => {
  switch (provider) {
    case "kakao":
      return (
        <KakaoProfileIcon
          size={size}
          className={className}
        />
      );
    case "google":
      return (
        <GoogleProfileIcon
          size={size}
          className={className}
        />
      );
    case "naver":
      return (
        <NaverProfileIcon
          size={size}
          className={className}
        />
      );
  }
};

/**
 * 카카오 프로필 아이콘
 */
export const KakaoProfileIcon = ({
  size = 100,
  className = "",
}: {
  size?: number;
  className?: string;
}) => {
  // 로고 크기 비율 계산 (100px 기준 56px 로고)
  const logoSize = (size * 56) / 100;

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#FEE500] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={logoSize}
        height={logoSize * (53 / 56)}
        viewBox="0 0 56 53"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M28.0002 0C12.5353 0 0 9.68476 0 21.6293C0 29.0579 4.84839 35.6066 12.2315 39.5016L9.12501 50.8495C8.85056 51.8523 9.99733 52.6515 10.8779 52.0704L24.4949 43.0833C25.6441 43.1942 26.8119 43.2589 28.0002 43.2589C43.4638 43.2589 56 33.5745 56 21.6293C56 9.68476 43.4638 0 28.0002 0"
          fill="black"
        />
      </svg>
    </div>
  );
};

/**
 * 구글 프로필 아이콘
 */
export const GoogleProfileIcon = ({
  size = 100,
  className = "",
}: {
  size?: number;
  className?: string;
}) => {
  // 로고 크기 비율 계산 (100px 기준 68px 로고)
  const logoSize = (size * 68) / 100;

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#F1F4F8] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 68 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M67.32 34.765C67.32 32.385 67.115 30.09 66.74 27.88H34.34V40.91H52.905C52.155 45.08 49.81 48.615 46.31 51.03V59.595H57.24C63.56 53.75 67.32 45.115 67.32 34.765Z"
          fill="#4285F4"
        />
        <path
          d="M34.34 67.88C43.49 67.88 51.175 64.855 57.24 59.595L46.31 51.03C43.285 53.07 39.385 54.295 34.34 54.295C25.495 54.295 17.985 48.38 15.3 40.355H4.03V49.17C10.06 61.13 21.38 67.88 34.34 67.88Z"
          fill="#34A853"
        />
        <path
          d="M15.3 40.355C14.635 38.315 14.26 36.14 14.26 33.88C14.26 31.62 14.635 29.445 15.3 27.405V18.59H4.03C1.7 23.235 0.34 28.395 0.34 33.88C0.34 39.365 1.7 44.525 4.03 49.17L15.3 40.355Z"
          fill="#FBBC05"
        />
        <path
          d="M34.34 13.465C39.86 13.465 44.81 15.335 48.72 18.965L57.515 10.17C51.16 4.23 43.475 0.88 34.34 0.88C21.38 0.88 10.06 7.63 4.03 18.59L15.3 27.405C17.985 19.38 25.495 13.465 34.34 13.465Z"
          fill="#EA4335"
        />
      </svg>
    </div>
  );
};

/**
 * 네이버 프로필 아이콘
 */
export const NaverProfileIcon = ({
  size = 100,
  className = "",
}: {
  size?: number;
  className?: string;
}) => {
  // 로고 크기 비율 계산 (100px 기준 52px 로고)
  const logoSize = (size * 52) / 100;

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#03C75A] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M35.2596 27.8287L15.9798 0H0V52H16.7404V24.167L36.0202 52H52V0H35.2596V27.8287Z"
          fill="white"
        />
      </svg>
    </div>
  );
};
