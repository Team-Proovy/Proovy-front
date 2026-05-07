import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** 최외곽 스크롤 div에 추가할 클래스 (padding 등 기본값 재정의 가능) */
  className?: string;
  /** 콘텐츠 너비 제한 div에 추가할 클래스 */
  innerClassName?: string;
}

/**
 * 앱 페이지 공통 래퍼.
 * - 세로 스크롤 컨텍스트 (h-screen, overflow-y-auto)
 * - 상단 97px / 하단 80px 기본 여백
 * - 외곽 캡 max-w-[1680px]
 * - 콘텐츠 너비: base → max-w-[800px] / 3xl(1360px+) → max-w-[1080px]
 */
export const PageContainer = ({
  children,
  className,
  innerClassName,
}: PageContainerProps) => (
  <div
    className={`h-screen w-full overflow-y-auto bg-white pt-[60px] pb-12${className ? ` ${className}` : ""}`}
  >
    <div className="mx-auto w-full max-w-[1680px]">
      <div className="flex justify-center">
        <div
          className={`w-full max-w-[800px] 3xl:max-w-[1080px]${innerClassName ? ` ${innerClassName}` : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  </div>
);
