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
/** 6. UserIcon (프로필 아바타 아이콘) */
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
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M30.6076 33.9945H9.3924L9.42376 32.7872C9.5492 27.9734 11.9169 18.8789 20.0078 18.8789C28.0988 18.8789 30.4665 27.9734 30.5919 32.7872L30.6233 33.9945H30.6076ZM11.8542 31.6425H28.1458C27.8322 28.6633 26.3897 21.2309 20.0078 21.2309C13.626 21.2309 12.1835 28.6633 11.8699 31.6425H11.8542Z"
        fill={color}
      />
      <path
        d="M20.0078 6.00537C23.4418 6.00537 26.2328 8.79643 26.2328 12.2304C26.2328 15.6643 23.4418 18.4554 20.0078 18.4554C16.5739 18.4554 13.7828 15.6643 13.7828 12.2304C13.7828 8.79643 16.5739 6.00537 20.0078 6.00537Z"
        fill={`url(#${gid})`}
      />
      <defs>
        <linearGradient
          id={gid}
          x1="20.0078"
          y1="6.00537"
          x2="20.0078"
          y2="18.4397"
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
