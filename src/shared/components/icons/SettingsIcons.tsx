import type { SVGProps } from "react";
import { useId } from "react";

/**
 * 유저 프로필 아이콘
 */
export const ProfileIcon = ({
  color = "#2A6AFF",
  size = 36,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; color?: string }) => {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.7601 4.03027C7.28008 4.03027 2.83008 8.47027 2.83008 13.9603C2.83008 16.9703 4.17008 19.6603 6.29008 21.4803V20.9203C6.29008 17.8803 8.76008 15.4103 11.8001 15.4103H13.7201C16.7601 15.4103 19.2301 17.8803 19.2301 20.9203V21.4803C21.3401 19.6603 22.6901 16.9703 22.6901 13.9603C22.6901 8.48027 18.2501 4.03027 12.7601 4.03027ZM12.7601 15.2303C10.6501 15.2303 8.93008 13.5203 8.93008 11.4003C8.93008 9.28027 10.6401 7.57027 12.7601 7.57027C14.8801 7.57027 16.5901 9.28027 16.5901 11.4003C16.5901 13.5203 14.8801 15.2303 12.7601 15.2303Z"
        fill={`url(#${gid})`}
      />
      <defs>
        <linearGradient
          id={gid}
          x1="12.7601"
          y1="4.03027"
          x2="12.7601"
          y2="21.4803"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor={color}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * 구독 정보 아이콘 (원 + 체크마크)
 * - 활성화: 파란색 (#2A6AFF)
 * - 비활성화: 회색 (#6B7280)
 */
export const SubscriptionIcon = ({
  isActive = false,
  size = 36,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; isActive?: boolean }) => {
  // 활성화: 파란색, 비활성화: 회색
  const activeColor = "#2A6AFF";
  const inactiveColor = "#6B7280";
  const color = isActive ? activeColor : inactiveColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 원 (테두리) */}
      <path
        d="M18.0068 31.061C10.8097 31.061 4.95312 25.2044 4.95312 18.0073C4.95312 10.8101 10.7955 4.93945 18.0068 4.93945C25.2181 4.93945 31.0605 10.796 31.0605 17.9932C31.0605 25.1903 25.204 31.0469 18.0068 31.0469V31.061ZM18.0068 7.05627C11.9668 7.05627 7.06994 11.9673 7.06994 17.9932C7.06994 24.019 11.981 28.93 18.0068 28.93C24.0327 28.93 28.9437 24.019 28.9437 17.9932C28.9437 11.9673 24.0327 7.05627 18.0068 7.05627Z"
        fill={color}
      />
      {/* 체크마크 */}
      <path
        d="M12.842 25.4163L9.29982 18.2473H6.43506V16.1305H10.6122L12.9125 20.7875L17.3719 12.4473H28.6616V14.5641H18.642L12.842 25.4163Z"
        fill={color}
      />
    </svg>
  );
};

/**
 * 크레딧 아이콘 (다이아몬드)
 * - 활성화: 파란색 (#2A6AFF)
 * - 비활성화: 회색 (#6B7280)
 */
export const CreditIcon = ({
  isActive = false,
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; isActive?: boolean }) => {
  const gradId1 = useId();
  const gradId2 = useId();

  // 활성화: 파란색, 비활성화: 회색
  const activeColor = "#2A6AFF";
  const inactiveColor = "#6B7280";
  const color = isActive ? activeColor : inactiveColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.85453 11.8419L7.46797 13.7753L11.3216 9.14834H18.4954L12.2683 1.85449L3.73438 11.8419H5.85453Z"
        fill={`url(#${gradId1})`}
      />
      <path
        d="M20.1089 10.7754H12.2816L7.62799 16.3491L5.24115 13.4556H3.73438L12.4417 23.6563L21.7757 12.7222L20.1089 10.7754Z"
        fill={`url(#${gradId2})`}
      />
      <defs>
        <linearGradient
          id={gradId1}
          x1="11.1149"
          y1="1.85449"
          x2="11.1149"
          y2="13.7753"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.5"
          />
        </linearGradient>
        <linearGradient
          id={gradId2}
          x1="12.755"
          y1="10.7754"
          x2="12.755"
          y2="23.6563"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor={color}
            stopOpacity="0.5"
          />
          <stop
            offset="1"
            stopColor={color}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * 캘린더 아이콘
 * - 활성화: 파란색 (#2A6AFF)
 * - 비활성화: 회색 (#6B7280)
 */
export const CalendarIcon = ({
  isActive = false,
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; isActive?: boolean }) => {
  const gradId = useId();

  // 활성화: 파란색, 비활성화: 회색
  const activeColor = "#2A6AFF";
  const inactiveColor = "#6B7280";
  const color = isActive ? activeColor : inactiveColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22.1355 12.0285H2.84082V5.70801H8.48122H22.1355V12.0285Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M8.268 3.48047H6.93457V5.69396H8.268V3.48047Z"
        fill={color}
      />
      <path
        d="M18.0551 3.48047H16.7217V5.69396H18.0551V3.48047Z"
        fill={color}
      />
      <path
        d="M15.8151 22.029H2.84082V12.0283H4.17425V20.6956H15.8151V22.029Z"
        fill={color}
      />
      <path
        d="M22.6689 17.8418H15.6284V19.1752H22.6689V17.8418Z"
        fill={color}
      />
      <path
        d="M19.8285 14.9883H18.4951V22.0288H19.8285V14.9883Z"
        fill={color}
      />
      <defs>
        <linearGradient
          id={gradId}
          x1="12.4882"
          y1="12.0285"
          x2="12.4882"
          y2="5.70801"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor={color}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * 닫기 아이콘 (X)
 * - 기본: 검정색 (#000000)
 * - 호버: 파란색 (#2A6AFF)
 */
export const CloseIcon = ({
  color = "black",
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; color?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 13.3998L7.10005 18.2998C6.91672 18.4831 6.68338 18.5748 6.40005 18.5748C6.11672 18.5748 5.88338 18.4831 5.70005 18.2998C5.51672 18.1165 5.42505 17.8831 5.42505 17.5998C5.42505 17.3165 5.51672 17.0831 5.70005 16.8998L10.6 11.9998L5.70005 7.0998C5.51672 6.91647 5.42505 6.68314 5.42505 6.3998C5.42505 6.11647 5.51672 5.88314 5.70005 5.6998C5.88338 5.51647 6.11672 5.4248 6.40005 5.4248C6.68338 5.4248 6.91672 5.51647 7.10005 5.6998L12 10.5998L16.9 5.6998C17.0834 5.51647 17.3167 5.4248 17.6 5.4248C17.8834 5.4248 18.1167 5.51647 18.3 5.6998C18.4834 5.88314 18.575 6.11647 18.575 6.3998C18.575 6.68314 18.4834 6.91647 18.3 7.0998L13.4 11.9998L18.3 16.8998C18.4834 17.0831 18.575 17.3165 18.575 17.5998C18.575 17.8831 18.4834 18.1165 18.3 18.2998C18.1167 18.4831 17.8834 18.5748 17.6 18.5748C17.3167 18.5748 17.0834 18.4831 16.9 18.2998L12 13.3998Z"
        fill={color}
      />
    </svg>
  );
};
