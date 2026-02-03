import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

// 왼쪽 화살표 아이콘
export const ArrowLeftIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={(size * 7) / 16}
    viewBox="0 0 16 7"
    fill="none"
    {...props}
  >
    <path
      d="M15.1533 3.2H1.35327M1.35327 3.2L5.03327 0.75M1.35327 3.2L5.03327 5.65"
      stroke="#003880"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 오른쪽 화살표 아이콘
export const ArrowRightIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={(size * 7) / 16}
    viewBox="0 0 16 7"
    fill="none"
    {...props}
  >
    <path
      d="M0.750049 3.2H14.55M14.55 3.2L10.87 0.75M14.55 3.2L10.87 5.65"
      stroke="#003880"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
