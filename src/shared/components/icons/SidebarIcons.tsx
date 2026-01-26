import type { SVGProps } from "react";
import { useId } from "react";

// 1. HomeIcon
export function HomeIcon({
  color = "currentColor",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} /* 고정값 26 대신 변수 사용 */
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      {...props} /* props 전달 추가 */
    >
      <path
        d="M21.51 21.01H4.01001V8.22999H8.25001L9.54001 11.2L14.75 3.98999L21.51 13V21V21.01ZM5.51001 19.51H20.01V13.51L14.77 6.51999L9.21001 14.21L7.27001 9.72999H5.51001V19.51Z"
        fill={color}
      />
    </svg>
  );
}

// 2. NoteIcon
export function NoteIcon({
  color = "currentColor",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const gradientId = `note-grad-${color.replace("#", "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      {...props}
    >
      <path
        d="M4.76001 8.58V20.75H20.76V4.87H13.08L9.29001 11.91L7.52001 8.58H4.76001Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M9.29001 14.28L7.09001 10.15H4.76001V8.48001H7.95001L9.30001 11.01L12.65 4.76001H20.76V6.44001H13.5L9.29001 14.28Z"
        fill={color}
      />
      <defs>
        <linearGradient
          id={gradientId} /* 👈 gradientId 변수와 일치하도록 수정 */
          x1="12.76"
          y1="4.87"
          x2="12.76"
          y2="20.75"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" /> {/* 👈 stop-color -> stopColor */}
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.3" /* 👈 stop-opacity -> stopOpacity */
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 3. ChattingIcon
export function ChattingIcon({
  color = "currentColor",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} /* 변수 사용으로 수정 */
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      {...props} /* props 전달 추가 */
    >
      <path
        d="M9.64002 20.58L7.47002 17.93H4.58002L4.63002 4.92999H20.92V15.25H13.39L9.64002 20.58ZM6.24002 16.29H8.26002L9.55002 17.87L12.55 13.61H19.29V6.57999H6.27002L6.23002 16.3L6.24002 16.29Z"
        fill={color}
      />
    </svg>
  );
}

// 4. RepositoryIcon (기존 수정본 유지)
export function RepositoryIcon({
  color = "currentColor",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const gradientId = `repo-grad-${color.replace("#", "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      {...props}
    >
      <path
        d="M4.76001 12.18V20.01H20.76V9.79004H13.08L9.29001 14.33L7.52001 12.18H4.76001Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M9.29001 16.23L7.17001 13.67H4.76001V12.17H7.87001L9.30001 13.89L12.73 9.77002H20.76V11.27H13.43L9.29001 16.23Z"
        fill={color}
      />
      <path
        d="M19.86 7.14001H5.65002V8.64002H19.86V7.14001Z"
        fill={color}
      />
      <path
        d="M18.32 4.75H7.19V6.25H18.32V4.75Z"
        fill={color}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="12.76"
          y1="9.79004"
          x2="12.76"
          y2="20.01"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.3"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 5. SlideIcon (사이드바 접기/펴기 버튼)
export function SlideIcon({
  color = "currentColor",
  size = 40,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.6053 10.741H7.30694V29.2592H16.6053V10.741Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M33.8848 30.4352H6.13093V9.56494H33.8848V30.4352ZM8.48295 28.0832H31.5327V11.917H8.48295V28.0832Z"
        fill={color}
      />
      <defs>
        <linearGradient
          id={gid}
          x1="11.9483"
          y1="10.741"
          x2="11.9483"
          y2="29.2592"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.3"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}
// 6. UserIcon (프로필 아바타 아이콘)
export function UserIcon({
  color = "#2A6AFF",
  size = 40,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
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
}

/** 7. NewChatIcon (새 채팅 시작 아이콘) */
export function NewChatIcon({
  color = "#2A6AFF",
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.14073 22.0855L4.0784 18.3457H0L0.0705608 0H23.0592V14.5637H12.4328L7.14073 22.0855ZM2.34261 16.0314H5.19326L7.01372 18.2611L11.2474 12.2493H20.7589V2.3285H2.38495L2.3285 16.0455L2.34261 16.0314Z"
        fill={color}
      />
    </svg>
  );
}

/** 8. ToolIcon (도구 버튼 왼쪽 아이콘) */
export function ToolIcon({
  color = "#666666",
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const gradId1 = useId(); //
  const gradId2 = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.26186 6.07762L2.26735 3.65974H0V2.24853H2.92591L4.27127 3.86672L7.49824 0H15.0529V1.41121H8.1568L4.26186 6.07762Z"
        fill={color}
      />
      <path
        d="M6.47275 4.80753L3.23638 3.62211L0 2.4461L0.884359 0L7.36652 2.35202L6.47275 4.80753Z"
        fill={`url(#${gradId1})`}
      />
      <path
        d="M2.78664 3.46385L1.7478 6.31958L2.63193 6.6412L3.67076 3.78547L2.78664 3.46385Z"
        fill={color}
      />
      <path
        d="M0 2.24853V9.61505H15.0529V0H7.82752L4.26186 4.27127L2.59663 2.24853H0Z"
        fill={`url(#${gradId2})`}
      />
      <defs>
        <linearGradient
          id={gradId1}
          x1="3.22742"
          y1="3.63852"
          x2="4.11938"
          y2="1.18788"
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
          x1="7.52646"
          y1="0"
          x2="7.52646"
          y2="9.61505"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.5"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** 9. SendArrowIcon (전송 버튼 아이콘) */
export function SendArrowIcon({
  color = "#666666",
  size = 16,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size * 0.75} // 비율 유지를 위해 보정
      height={size}
      viewBox="0 0 12 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 15V2 M1 7L6 2L11 7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 10. BarArrowIcon (사이드바 접기/펴기 버튼)

export const BarArrowIcon = ({
  color = "currentColor",
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => {
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
        d="M1 25L0.999998 0.999999"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 13L7 13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.666 3.66658L6.33268 12.9999L15.666 22.3333"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// 11. 사이드바 하단 paper 아이콘.
export const PaperIcon = ({
  size = 16,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.3538 4.14625L10.8538 1.64625C10.8073 1.59983 10.7521 1.56303 10.6914 1.53793C10.6307 1.51284 10.5657 1.49995 10.5 1.5H5.5C5.23478 1.5 4.98043 1.60536 4.79289 1.79289C4.60536 1.98043 4.5 2.23478 4.5 2.5V3.5H3.5C3.23478 3.5 2.98043 3.60536 2.79289 3.79289C2.60536 3.98043 2.5 4.23478 2.5 4.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H10.5C10.7652 14.5 11.0196 14.3946 11.2071 14.2071C11.3946 14.0196 11.5 13.7652 11.5 13.5V12.5H12.5C12.7652 12.5 13.0196 12.3946 13.2071 12.2071C13.3946 12.0196 13.5 11.7652 13.5 11.5V4.5C13.5001 4.43432 13.4872 4.36927 13.4621 4.30858C13.437 4.24788 13.4002 4.19272 13.3538 4.14625ZM10.5 13.5H3.5V4.5H8.29313L10.5 6.70687V13.5ZM12.5 11.5H11.5V6.5C11.5001 6.43432 11.4872 6.36927 11.4621 6.30858C11.437 6.24788 11.4002 6.19272 11.3538 6.14625L8.85375 3.64625C8.80728 3.59983 8.75212 3.56303 8.69143 3.53793C8.63073 3.51284 8.56568 3.49995 8.5 3.5H5.5V2.5H10.2931L12.5 4.70688V11.5ZM9 9.5C9 9.63261 8.94732 9.75979 8.85355 9.85355C8.75979 9.94732 8.63261 10 8.5 10H5.5C5.36739 10 5.24021 9.94732 5.14645 9.85355C5.05268 9.75979 5 9.63261 5 9.5C5 9.36739 5.05268 9.24021 5.14645 9.14645C5.24021 9.05268 5.36739 9 5.5 9H8.5C8.63261 9 8.75979 9.05268 8.85355 9.14645C8.94732 9.24021 9 9.36739 9 9.5ZM9 11.5C9 11.6326 8.94732 11.7598 8.85355 11.8536C8.75979 11.9473 8.63261 12 8.5 12H5.5C5.36739 12 5.24021 11.9473 5.14645 11.8536C5.05268 11.7598 5 11.6326 5 11.5C5 11.3674 5.05268 11.2402 5.14645 11.1464C5.24021 11.0527 5.36739 11 5.5 11H8.5C8.63261 11 8.75979 11.0527 8.85355 11.1464C8.94732 11.2402 9 11.3674 9 11.5Z"
        fill="#333333"
      />
    </svg>
  );
};

// 12. SearchIcon (돋보기 아이콘)
export const SearchIcon = ({
  color,
  size = 33,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; color?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 33 33"
      fill={color ?? "currentColor"}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M29.242 29.333L20.5795 20.6705C19.892 21.2205 19.1014 21.6559 18.2076 21.9768C17.3139 22.2976 16.3628 22.458 15.3545 22.458C12.8566 22.458 10.7427 21.5927 9.01299 19.862C7.28324 18.1313 6.41791 16.0175 6.41699 13.5205C6.41608 11.0235 7.28141 8.90967 9.01299 7.17901C10.7446 5.44834 12.8584 4.58301 15.3545 4.58301C17.8506 4.58301 19.9649 5.44834 21.6974 7.17901C23.4299 8.90967 24.2947 11.0235 24.292 13.5205C24.292 14.5288 24.1316 15.4799 23.8107 16.3736C23.4899 17.2674 23.0545 18.058 22.5045 18.7455L31.167 27.408L29.242 29.333ZM15.3545 19.708C17.0732 19.708 18.5344 19.1067 19.738 17.904C20.9416 16.7013 21.5429 15.2402 21.542 13.5205C21.5411 11.8008 20.9397 10.3401 19.738 9.13838C18.5362 7.93663 17.0751 7.33484 15.3545 7.33301C13.6339 7.33117 12.1732 7.93297 10.9724 9.13838C9.77153 10.3438 9.16974 11.8045 9.16699 13.5205C9.16424 15.2365 9.76603 16.6977 10.9724 17.904C12.1787 19.1103 13.6394 19.7117 15.3545 19.708Z" />
    </svg>
  );
};

// 13. SettingIcon (설정 아이콘)
export const SettingIcon = ({
  color = "#333333",
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.99987 1.66699L17.2165 5.83366V14.167L9.99987 18.3337L2.7832 14.167V5.83366L9.99987 1.66699Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M13.3337 10.0003C13.3337 10.8844 12.9825 11.7322 12.3573 12.3573C11.7322 12.9825 10.8844 13.3337 10.0003 13.3337C9.11627 13.3337 8.26842 12.9825 7.6433 12.3573C7.01818 11.7322 6.66699 10.8844 6.66699 10.0003C6.66699 9.11627 7.01818 8.26842 7.6433 7.6433C8.26842 7.01818 9.11627 6.66699 10.0003 6.66699C10.8844 6.66699 11.7322 7.01818 12.3573 7.6433C12.9825 8.26842 13.3337 9.11627 13.3337 10.0003Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
};

// 14. CreditIcon (크레딧 아이콘)
export const CreditIcon = ({
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => {
  const gradId1 = useId();
  const gradId2 = useId();

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
            stopColor="#2A6AFF"
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
            stopColor="#2A6AFF"
            stopOpacity="0.5"
          />
          <stop
            offset="1"
            stopColor="#2A6AFF"
          />
        </linearGradient>
      </defs>
    </svg>
  );
};
