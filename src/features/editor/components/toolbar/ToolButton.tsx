import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  as?: "button" | "div";
}

/**
 * ToolButton - 순수 버튼 컨테이너
 *
 * 역할: 클릭 이벤트 + 접근성(a11y)만 담당
 * 스타일: 외부에서 className으로 전달 (toolbar_styles.ts 사용)
 */
export const ToolButton = forwardRef<
  HTMLButtonElement | HTMLDivElement,
  ToolButtonProps
>(({ children, className = "", as = "button", onClick, ...props }, ref) => {
  const Component = as as any;

  // 공통 레이아웃만 (색상/상태 스타일은 외부에서 className으로 전달)
  const baseClass =
    "flex items-center justify-center cursor-pointer select-none font-[Pretendard] text-[16px] leading-[24px] transition-colors duration-200";

  // div를 버튼처럼 사용할 때 접근성 속성
  const a11yProps =
    as === "div"
      ? {
          role: "button",
          tabIndex: 0,
          onKeyDown: ((e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick?.(e as any);
            }
            props.onKeyDown?.(e as any);
          }) as any,
        }
      : { type: "button" as const };

  return (
    <Component
      ref={ref as any}
      className={`${baseClass} ${className}`}
      onClick={onClick as any}
      {...props}
      {...a11yProps}
    >
      {children}
    </Component>
  );
});

ToolButton.displayName = "ToolButton";
