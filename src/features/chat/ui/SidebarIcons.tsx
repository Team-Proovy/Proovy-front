import { useId } from "react";
import type { SVGProps } from "react";

/**
 * 1) 슬라이드바 (40x40)
 * - 피그마 SVG 그대로, 단 색상은 currentColor로 제어 가능하도록 일부 조정
 */
export function SlideIcon(props: SVGProps<SVGSVGElement>) {
  const gid = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      {...props}
    >
      <path
        d="M16.6053 10.741H7.30694V29.2592H16.6053V10.741Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M33.8848 30.4352H6.13093V9.56494H33.8848V30.4352ZM8.48295 28.0832H31.5327V11.917H8.48295V28.0832Z"
        fill="currentColor"
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
            stopColor="#6D6D6D"
            stopOpacity="0.3"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 2) 홈 (36x36)
 */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      {...props}
    >
      <path
        d="M30.3552 29.6494H5.65896V11.6142H11.6425L13.463 15.8054L20.8154 5.63062L30.3552 18.3456V29.6353V29.6494ZM7.77578 27.5326H28.2383V19.0653L20.8436 9.20098L12.9973 20.0532L10.2595 13.731H7.77578V27.5326Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * 3) 파일 기본 (36x36) - 그라데이션 + outline
 */
export function FileIcon(props: SVGProps<SVGSVGElement>) {
  const gid = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      {...props}
    >
      <path
        d="M6.71737 12.1082V29.2826H29.2967V6.87256H18.4586L13.1102 16.8075L10.6123 12.1082H6.71737Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M13.1102 20.152L10.0055 14.3237H6.71737V11.967H11.2191L13.1243 15.5374L17.8518 6.71729H29.2967V9.08812H19.0514L13.1102 20.152Z"
        fill="currentColor"
      />
      <defs>
        <linearGradient
          id={gid}
          x1="18.0071"
          y1="6.87256"
          x2="18.0071"
          y2="29.2826"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop
            offset="1"
            stopColor="#6D6D6D"
            stopOpacity="0.3"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 4) 채팅 (36x36) - 파란색(currentColor로 제어)
 */
export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      {...props}
    >
      <path
        d="M30.1576 17.9789H28.0408V8.45324H11.4308V6.33643H30.1576V17.9789Z"
        fill="currentColor"
      />
      <path
        d="M12.3622 29.6636L9.56801 26.2484H5.84241L5.89886 9.51147H26.8695V22.8051H17.1744L12.3481 29.6777L12.3622 29.6636ZM7.97334 24.1316H10.57L12.2352 26.1638L16.0878 20.6742H24.7668V11.6142H8.01568L7.97334 24.1175V24.1316Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * 5) 보관함
 * - (상단 막대 2개) + (하단 그라데이션 박스) 를 수직 스택으로 합성
 * - "클릭 영역/패딩"은 버튼이 담당하고, 아이콘은 내부 스택만 담당
 */
export function StorageIcon(props: SVGProps<SVGSVGElement>) {
  const gid = useId();

  return (
    <div className="flex flex-col items-start gap-[1.595px]">
      {/* 상단 막대 2개 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="21"
        height="6"
        viewBox="0 0 21 6"
        fill="none"
      >
        <path
          d="M20.0533 3.3728H0V5.48962H20.0533V3.3728Z"
          fill="currentColor"
        />
        <path
          d="M17.88 0H2.17326V2.11682H17.88V0Z"
          fill="currentColor"
        />
      </svg>

      {/* 하단 박스(그라데이션) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="23"
        height="15"
        viewBox="0 0 23 15"
        fill="none"
        {...props}
      >
        <path
          d="M0 3.3728V14.4226H22.5794V0H11.7413L6.39279 6.4069L3.89494 3.3728H0Z"
          fill={`url(#${gid})`}
        />
        <defs>
          <linearGradient
            id={gid}
            x1="11.2897"
            y1="0"
            x2="11.2897"
            y2="14.4226"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop
              offset="1"
              stopColor="#6D6D6D"
              stopOpacity="0.3"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * 6-1) 유저 아이콘 SVG (40x40)
 */
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  const gid = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      {...props}
    >
      <path
        d="M30.6076 33.9945H9.3924L9.42376 32.7872C9.5492 27.9734 11.9169 18.8789 20.0078 18.8789C28.0988 18.8789 30.4665 27.9734 30.5919 32.7872L30.6233 33.9945H30.6076ZM11.8542 31.6425H28.1458C27.8322 28.6633 26.3897 21.2309 20.0078 21.2309C13.626 21.2309 12.1835 28.6633 11.8699 31.6425H11.8542Z"
        fill="#2A6AFF"
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
            stopColor="#2A6AFF"
            stopOpacity="0.3"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 6-2) 유저 아이콘 테두리 원 Wrapper
 * - Layout: 40x40, radius 20, border 0.5 #C6C6C6
 */
export function UserIconCircleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label="user"
      onClick={onClick}
      className={[
        "flex h-[40px] w-[40px] items-center justify-center",
        "rounded-[20px]",
        "border-[0.5px] border-[#C6C6C6]",
        "bg-white",
        "cursor-pointer transition select-none",
        "hover:bg-black/5",
        "active:scale-[0.98]",
        "focus:ring-2 focus:ring-[#2A6AFF]/40 focus:outline-none",
      ].join(" ")}
    >
      <UserIcon />
    </button>
  );
}

/**
 * 새 채팅 아이콘
 */
export function NewChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="23"
      viewBox="0 0 24 23"
      fill="none"
      {...props}
    >
      <path
        d="M7.14073 22.0855L4.0784 18.3457H0L0.0705608 0H23.0592V14.5637H12.4328L7.14073 22.0855ZM2.34261 16.0314H5.19326L7.01372 18.2611L11.2474 12.2493H20.7589V2.3285H2.38495L2.3285 16.0455L2.34261 16.0314Z"
        fill="#2A6AFF"
      />
    </svg>
  );
}

/**
 * 도구 버튼 왼쪽 아이콘
 * - 제공된 3개의 SVG 조각을 하나의 아이콘으로 통합
 */
export function ToolIcon(props: SVGProps<SVGSVGElement>) {
  const gradId1 = useId();
  const gradId2 = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 16 10"
      fill="none"
      {...props}
    >
      {/* 요소 1 */}
      <path
        d="M4.26186 6.07762L2.26735 3.65974H0V2.24853H2.92591L4.27127 3.86672L7.49824 0H15.0529V1.41121H8.1568L4.26186 6.07762Z"
        fill="#666666"
      />
      {/* 요소 2 (상단 작은 종이 + 그림자) */}
      <path
        d="M6.47275 4.80753L3.23638 3.62211L0 2.4461L0.884359 0L7.36652 2.35202L6.47275 4.80753Z"
        fill={`url(#${gradId1})`}
      />
      <path
        d="M2.78664 3.46385L1.7478 6.31958L2.63193 6.6412L3.67076 3.78547L2.78664 3.46385Z"
        fill="#666666"
      />
      {/* 요소 3 (아래 그라디언트 박스) */}
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
            stopColor="#666666"
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
            stopColor="#666666"
            stopOpacity="0.5"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 전송 화살표 아이콘 (수정된 버전)
 * - 머리와 꼬리를 하나의 SVG로 통합하여 끊김 현상 해결
 * - 두께를 통일하여 자연스러운 연결
 */
export function SendArrowIcon(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: "12px", height: "16px" }} // 전체 사이즈 설정
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 12 16" // 뷰박스 좌표계 설정
        fill="none"
      >
        {/* d 속성 설명:
           M 6 15 V 2 : 가로 6, 세로 15 지점에서 세로 2 지점까지 수직선(V) 그리기 (몸통)
           M 1 7 L 6 2 L 11 7 : (1,7)에서 (6,2)로 갔다가 (11,7)로 이어지는 꺾은선 (머리)
        */}
        <path
          d="M6 15V2 M1 7L6 2L11 7"
          stroke="#666666"
          strokeWidth="3" // 두께 통일 (기존 3과 4 사이에서 적절한 값 선택)
          strokeLinecap="round"
          strokeLinejoin="round" // 꺾이는 모서리를 둥글게 처리
        />
      </svg>
    </div>
  );
}
/**
 * 7) Gemini 배지 (테두리 + 로고 + count)
 * - Container: 60x28, padding 9px 7px, radius 8, border 0.5
 * - 내부: 로고(14x14) + 텍스트 간격 8
 */
export function GeminiBadge({
  count,
  logoSrc,
  onClick,
  wrapperClassName,
}: {
  count: number | string;
  logoSrc: string; // 예: import한 png 경로 or public 경로
  onClick?: () => void;
  wrapperClassName?: string; // 위치 고정용(예: "absolute left-1/2 top-[971px] -translate-x-1/2")
}) {
  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        aria-label="gemini credits"
        onClick={onClick}
        className={[
          "flex h-[28px] w-[60px] items-center justify-center",
          "rounded-[8px]",
          "border-[0.5px] border-[#C6C6C6]",
          "bg-white",
          "px-[7px] py-[9px]", // Figma: padding 9px 7px
          "cursor-pointer transition select-none",
          "hover:bg-black/5",
          "active:scale-[0.98]",
          "focus:ring-2 focus:ring-[#2A6AFF]/40 focus:outline-none",
        ].join(" ")}
      >
        <div className="flex items-center gap-[8px]">
          <img
            src={logoSrc}
            alt="gemini"
            className="h-[14px] w-[14px]"
            draggable={false}
          />
          <span className="text-[12px] leading-none font-semibold text-[#333]">
            {count}
          </span>
        </div>
      </button>
    </div>
  );
}
