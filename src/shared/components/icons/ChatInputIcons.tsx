import type { SVGProps } from "react";

// 공통 SVG Props
type IconProps = SVGProps<SVGSVGElement>;

/**
 * 1. 클립 아이콘 (ClipIcon)
 * 17x17, 회색(#666666) -> Size controlled by className
 */
export const ClipIcon = (props: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 17 17"
      fill="none"
      {...props}
    >
      <path
        d="M5.7 16.4099C4.97 16.4099 4.26 16.0999 3.66 15.4999C2.96 14.7999 2.61 14.0299 2.61 13.2199C2.61 12.0299 3.4 11.2399 3.49 11.1499L10.55 4.08994L11.61 5.14994L4.54 12.2199C4.3 12.4599 3.61 13.3399 4.71 14.4399C5.04 14.7699 5.39 14.9199 5.73 14.9099C6.36 14.8899 6.98 14.3299 7.16 14.1099L15.21 6.05994C15.38 5.70994 16.05 4.06994 14.41 2.43994C12.53 0.55994 10.83 2.05994 10.82 2.07994C10.63 2.25994 1.06 11.8399 1.06 11.8399L0 10.7799C0 10.7799 9.59 1.19994 9.78 1.00994C9.97 0.819941 10.7 0.259941 11.71 0.0699406C12.65 -0.110059 14.07 -0.0300595 15.48 1.37994C17.6 3.49994 17.05 5.91994 16.47 6.89994L16.36 7.04994L8.27 15.1399C8.2 15.2199 7.2 16.3599 5.81 16.4199C5.77 16.4199 5.74 16.4199 5.7 16.4199V16.4099Z"
        fill="currentColor"
      />
    </svg>
  );
};

/**
 * 2. 도구 아이콘 (ToolIcon)
 * 26x26, 그라데이션 포함 -> Size controlled by className
 */
export const ToolIcon = (props: IconProps) => {
  return (
    <svg
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.87997 14.14L4.65997 8.02001L11.23 5.63L13.46 11.75L12.05 12.26L10.34 7.55L6.57997 8.92L8.28997 13.63L6.87997 14.14Z"
        fill="currentColor"
      />
      <path
        d="M4.76001 12.98V20.81H20.76V10.59H13.08L9.29001 15.13L7.52001 12.98H4.76001Z"
        fill="url(#paint0_linear_478_1774)"
      />
      <path
        d="M9.29001 17.03L7.17001 14.46H4.76001V12.96H7.87001L9.30001 14.68L12.73 10.57H20.76V12.07H13.43L9.29001 17.03Z"
        fill="currentColor"
      />
      <path
        d="M19.81 9.81001L16.37 8.55001L12.93 7.30001L13.87 4.70001L20.76 7.20001L19.81 9.81001Z"
        fill="url(#paint1_linear_478_1774)"
      />
      <path
        d="M15.892 8.38168L14.7878 11.4171L15.7275 11.7589L16.8317 8.72354L15.892 8.38168Z"
        fill="currentColor"
      />
      <defs>
        <linearGradient
          id="paint0_linear_478_1774"
          x1="12.76"
          y1="10.59"
          x2="12.76"
          y2="20.81"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor="#666666"
            stopOpacity="0.5"
          />
        </linearGradient>
        <linearGradient
          id="paint1_linear_478_1774"
          x1="16.3605"
          y1="8.56746"
          x2="17.3085"
          y2="5.96263"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor="#666666"
            stopOpacity="0.5"
          />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * 3. 드롭다운 아이콘 (DropdownIcon)
 * 15x10, 단순 화살표 -> Size controlled by className
 */
export const DropdownIcon = (props: IconProps) => {
  return (
    <svg
      viewBox="0 0 15 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1 1L7.5 8L14 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 4. 전송 아이콘 (SendIcon)
 * 20x25, Stroke & Fill 조합 -> Size controlled by className
 */
export const SendIcon = (props: IconProps) => {
  return (
    <svg
      viewBox="0 0 20 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18 11.4002L10 2.91539L2 11.4002"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M8 22.9154C8 24.0199 8.89543 24.9154 10 24.9154C11.1046 24.9154 12 24.0199 12 22.9154H10H8ZM10 4.73355H8V22.9154H10H12V4.73355H10Z"
        fill="currentColor"
      />
    </svg>
  );
};
