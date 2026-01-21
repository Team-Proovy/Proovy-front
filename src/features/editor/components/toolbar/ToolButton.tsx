import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  as?: "button" | "div";
}

export const ToolButton = forwardRef<
  HTMLButtonElement | HTMLDivElement,
  ToolButtonProps
>(
  (
    {
      children,
      isActive = false,
      className = "",
      as = "button",
      onClick,
      ...props
    },
    ref,
  ) => {
    const Component = as as any;

    // 공통 스타일 (InputToolbar에서 가져옴)
    const baseClass =
      "flex items-center justify-center cursor-pointer select-none border-[0.5px] border-[#C6C6C6] font-[Pretendard,sans-serif] font-normal text-[16px] leading-[24px] transition-all duration-400 ease-in-out active:scale-95";

    // 상태별 스타일 (Active vs Default)
    const stateClass = isActive
      ? "bg-blue-100 text-blue-600 border-blue-200"
      : "bg-[#F5F5F5] text-[#666] hover:bg-[#2A6AFF] hover:text-white hover:border-[#2A6AFF]";

    // Accessibility props for "div" acting as button
    const a11yProps =
      as === "div"
        ? {
            role: "button",
            tabIndex: 0,
            onKeyDown: ((e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                // Simulate click
                onClick?.(e as any);
              }
              props.onKeyDown?.(e as any);
            }) as any,
          }
        : {
            type: "button" as const,
          };

    return (
      <Component
        ref={ref as any}
        className={`${baseClass} ${stateClass} ${className}`}
        onClick={onClick as any}
        {...props}
        {...a11yProps}
      >
        {children}
      </Component>
    );
  },
);

ToolButton.displayName = "ToolButton";
