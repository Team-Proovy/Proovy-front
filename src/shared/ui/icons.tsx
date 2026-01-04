import type { SVGProps } from "react";

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
