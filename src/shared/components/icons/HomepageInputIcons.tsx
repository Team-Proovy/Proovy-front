import type { SVGProps } from "react";
import { useId } from "react";
// Homepage input 부분에 들어갈 아이콘들 모음집.

/** 1. PdfIcon (PDF 저장소 아이콘) */
export function PdfIcon({
  color = "#2A6AFF",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const gradientId = useId();

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
        d="M4.76001 10.08V20.96H20.76V6.76001H13.08L9.29001 13.05L7.52001 10.08H4.76001Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M10.76 6.31H5.76001V7.81H10.76V6.31Z"
        fill={color}
      />
      <path
        d="M9.01001 4.56H7.51001V9.56H9.01001V4.56Z"
        fill={color}
      />
      <path
        d="M9.29001 15.17L7.09001 11.48H4.76001V9.97997H7.95001L9.30001 12.25L12.65 6.65997H20.76V8.15997H13.5L9.29001 15.17Z"
        fill={color}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="12.76"
          y1="6.76001"
          x2="12.76"
          y2="20.96"
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

/** 2. ToolIcon (도구 아이콘) */
export function ToolIcon({
  color = "#2A6AFF",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  const gradientId = useId();

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
        d="M4.76001 10.08V20.96H20.76V6.76001H13.08L9.29001 13.05L7.52001 10.08H4.76001Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M10.76 6.31H5.76001V7.81H10.76V6.31Z"
        fill={color}
      />
      <path
        d="M9.01001 4.56H7.51001V9.56H9.01001V4.56Z"
        fill={color}
      />
      <path
        d="M9.29001 15.17L7.09001 11.48H4.76001V9.97997H7.95001L9.30001 12.25L12.65 6.65997H20.76V8.15997H13.5L9.29001 15.17Z"
        fill={color}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="12.76"
          y1="6.76001"
          x2="12.76"
          y2="20.96"
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
