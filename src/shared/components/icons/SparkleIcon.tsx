import { useId } from "react";
import type { SVGProps } from "react";

interface SparkleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

/**
 * 스파클(다이아몬드) 아이콘
 * AI 응답 생성 중 로딩 표시에 사용
 */
export const SparkleIcon = ({
  size = 24,
  color = "#6B7280",
  ...props
}: SparkleIconProps) => {
  const uid = useId();
  const smallId = `sparkle_gradient_small_${uid}`;
  const tinyId = `sparkle_gradient_tiny_${uid}`;
  const mainId = `sparkle_gradient_main_${uid}`;

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
        d="M7.22538 4.46875L4.40295 7.29117L7.22538 10.1136L10.0478 7.29117"
        fill={`url(#${smallId})`}
      />
      <path
        d="M8.48604 15.4014L6.41626 17.4617L8.48604 19.5315L10.5464 17.4617"
        fill={`url(#${tinyId})`}
      />
      <path
        d="M13.9428 7.10352L8.28857 12.7578L13.9428 18.4214L19.6065 12.7578"
        fill={`url(#${mainId})`}
      />
      <defs>
        <linearGradient
          id={smallId}
          x1="7.22538"
          y1="4.46875"
          x2="7.22538"
          y2="10.1136"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.4"
          />
        </linearGradient>
        <linearGradient
          id={tinyId}
          x1="8.48604"
          y1="15.4014"
          x2="8.48604"
          y2="19.5315"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.4"
          />
        </linearGradient>
        <linearGradient
          id={mainId}
          x1="13.9428"
          y1="7.10352"
          x2="13.9428"
          y2="18.4214"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop
            offset="1"
            stopColor={color}
            stopOpacity="0.4"
          />
        </linearGradient>
      </defs>
    </svg>
  );
};
