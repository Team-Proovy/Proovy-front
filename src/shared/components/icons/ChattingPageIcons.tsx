import type { SVGProps } from "react";

// 1. NewChattingIcon
export const NewChattingIcon = ({
  color = "#6B7280",
  size = 35,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.8542 28.2155L9.9473 24.6952H6.74707V8.80078H17.7879V10.8009H8.74721V22.6951H10.8807L12.6808 24.8686L16.2144 19.5215H24.3217V15.0412H26.3218V21.5217H17.2945L12.8542 28.2155Z"
        fill={color}
      />
      <path
        d="M24.2682 5.80078H22.2681V13.8013H24.2682V5.80078Z"
        fill={color}
      />
      <path
        d="M27.2686 8.80078H19.2681V10.8009H27.2686V8.80078Z"
        fill={color}
      />
    </svg>
  );
};

// 2. ChattingIcon
export const ChattingIcon = ({
  color = "#6B7280",
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => {
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
        d="M9.64002 20.58L7.47002 17.93H4.58002L4.63002 4.92999H20.92V15.25H13.39L9.64002 20.58ZM6.24002 16.29H8.26002L9.55002 17.87L12.55 13.61H19.29V6.57999H6.27002L6.23002 16.3L6.24002 16.29Z"
        fill={color}
      />
    </svg>
  );
};
