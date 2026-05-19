import { useId } from "react";

interface LoadingSpinnerProps {
  /** 스피너 크기 (기본: 160px) */
  size?: number;
  /** 추가 클래스 */
  className?: string;
}

export const LoadingSpinner = ({
  size = 160,
  className = "",
}: LoadingSpinnerProps) => {
  const clipPathId = `loading-spinner-${useId().replace(/:/g, "")}`;
  const capRadius = size / 16;
  const capCenterX = size * 0.9375;
  const capCenterY = size / 2;

  return (
    <svg
      className={`inline-block shrink-0 animate-spin ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        minWidth: size,
        minHeight: size,
        animationDuration: "1.0s",
      }}
      aria-label="Loading"
      role="status"
    >
      <g clipPath={`url(#${clipPathId})`}>
        <foreignObject
          x={0}
          y={0}
          width={size}
          height={size}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "conic-gradient(from 90deg at 50% 50%, #F1F4F8 0deg, #2A6AFF 360deg)",
            }}
          />
        </foreignObject>
      </g>
      <circle
        cx={capCenterX}
        cy={capCenterY}
        r={capRadius}
        fill="#2A6AFF"
      />
      <defs>
        <clipPath id={clipPathId}>
          <path
            transform={`scale(${size / 160})`}
            d="M160 80C160 124.183 124.183 160 80 160C35.8172 160 0 124.183 0 80C0 35.8172 35.8172 0 80 0C124.183 0 160 35.8172 160 80ZM20 80C20 113.137 46.8629 140 80 140C113.137 140 140 113.137 140 80C140 46.8629 113.137 20 80 20C46.8629 20 20 46.8629 20 80Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
