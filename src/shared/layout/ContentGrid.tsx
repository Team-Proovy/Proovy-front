import type { ReactNode } from "react";

type GridCols = 1 | 2 | 3 | 4 | 5;

const BASE_COLS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const XL3_COLS: Record<GridCols, string> = {
  1: "3xl:grid-cols-1",
  2: "3xl:grid-cols-2",
  3: "3xl:grid-cols-3",
  4: "3xl:grid-cols-4",
  5: "3xl:grid-cols-5",
};

interface ContentGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    base?: GridCols; /** 기본 컬럼 수 (default: 3) */
    xl3?: GridCols; /** 3xl(1360px+) 컬럼 수 (default: 4) */
  };
  /** Tailwind gap 클래스 문자열 (default: "gap-[20px]") */
  gapClass?: string;
}

export const ContentGrid = ({
  children,
  className,
  cols = {},
  gapClass = "gap-[20px]",
}: ContentGridProps) => {
  const { base = 3, xl3 = 4 } = cols;
  const classes = ["grid", BASE_COLS[base], gapClass, XL3_COLS[xl3], className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};
