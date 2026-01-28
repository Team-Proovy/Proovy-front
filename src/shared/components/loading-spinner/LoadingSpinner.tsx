interface LoadingSpinnerProps {
  /** 스피너 크기 (기본: 160px) */
  size?: number;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 로딩 스피너 컴포넌트
 * - Figma 디자인 기반: 파란색 (#2A6AFF) 그라데이션 원형 스피너
 * - 회전 애니메이션 적용
 */
export const LoadingSpinner = ({
  size = 160,
  className = "",
}: LoadingSpinnerProps) => {
  const strokeWidth = size * 0.1; // 스트로크 두께 (크기의 10%)
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animate-spin"
        style={{ animationDuration: "1.2s" }}
      >
        <defs>
          {/* 그라데이션 정의 */}
          <linearGradient
            id="spinnerGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="#2A6AFF"
              stopOpacity="0.1"
            />
            <stop
              offset="50%"
              stopColor="#2A6AFF"
              stopOpacity="0.5"
            />
            <stop
              offset="100%"
              stopColor="#2A6AFF"
              stopOpacity="1"
            />
          </linearGradient>
        </defs>

        {/* 배경 원 (연한 파란색) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A6AFF"
          strokeOpacity="0.15"
          strokeWidth={strokeWidth}
        />

        {/* 회전하는 호 (그라데이션) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#spinnerGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
};
