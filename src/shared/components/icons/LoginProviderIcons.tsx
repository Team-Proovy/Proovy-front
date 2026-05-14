/**
 * 설정 모달에서 로그인 제공자별 프로필 아이콘
 * - 카카오, 네이버 로그인 아이콘
 * - 크기: 100x100px, 원형
 */

export type LoginProvider = "kakao" | "naver" | "mock";

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
    case "naver":
      return (
        <NaverProfileIcon
          size={size}
          className={className}
        />
      );
    case "mock":
      return (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500 ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          M
        </div>
      );
    default: {
      // unknown provider인 경우 에러 대신 기본 아이콘(mock 스타일) 보여주기
      console.warn(`Unknown provider: ${provider}`);
      return (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500 ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          ?
        </div>
      );
    }
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
