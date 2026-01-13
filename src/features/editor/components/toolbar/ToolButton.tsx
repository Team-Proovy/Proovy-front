import type { ButtonHTMLAttributes } from "react";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  as?: "button" | "div";
}

export const ToolButton = ({
  children,
  isActive = false,
  className = "",
  as = "button",
  ...props
}: ToolButtonProps) => {
  const Component = as as React.ElementType; // Cast for TS safety

  // 공통 스타일 (InputToolbar에서 가져옴)
  const baseClass =
    "flex items-center justify-center cursor-pointer select-none border-[0.5px] border-[#C6C6C6] font-[Pretendard,sans-serif] font-normal text-[16px] leading-[24px] transition-all duration-400 ease-in-out active:scale-95";

  // 상태별 스타일 (Active vs Default)
  // Default: Gray Background + Blue/White Hover
  // Active: Blue Background + Blue Text (Math Input ON 상태 등)
  const stateClass = isActive
    ? "bg-blue-100 text-blue-600 border-blue-200"
    : "bg-[#F5F5F5] text-[#666] hover:bg-[#2A6AFF] hover:text-white hover:border-[#2A6AFF]";

  return (
    <Component
      className={`${baseClass} ${stateClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
