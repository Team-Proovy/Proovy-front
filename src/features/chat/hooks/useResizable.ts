import { useState, useCallback, useEffect, useRef } from "react";

interface UseResizableOptions {
  initialWidth: number; // 초기 너비 (%)
  minWidth?: number; // 최소 너비 (%) - 기본값
  maxWidth?: number; // 최대 너비 (%) - 기본값
  leftMinPx?: number; // 왼쪽 패널 최소 너비 (px)
  rightMinPx?: number; // 오른쪽 패널 최소 너비 (px)
}

interface UseResizableReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export const useResizable = ({
  initialWidth,
  minWidth = 0, // px 기반 사용 시 0%
  maxWidth = 100, // px 기반 사용 시 100%
  leftMinPx,
  rightMinPx,
}: UseResizableOptions): UseResizableReturn => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const widthRef = useRef(width);

  // width 변경 시 ref 업데이트
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  // 유효한 min/max 계산 함수
  const getEffectiveBounds = useCallback(
    (containerWidth: number) => {
      // 왼쪽 패널 최소 너비 (%)
      const leftMinPercent = leftMinPx
        ? Math.max(minWidth, (leftMinPx / containerWidth) * 100)
        : minWidth;

      // 오른쪽 패널 최소 너비를 고려한 왼쪽 패널 최대 너비 (%)
      const rightMinPercent = rightMinPx
        ? (rightMinPx / containerWidth) * 100
        : 0;
      const maxFromRight = 100 - rightMinPercent;
      const leftMaxPercent = Math.min(maxWidth, maxFromRight);

      return { min: leftMinPercent, max: leftMaxPercent };
    },
    [minWidth, maxWidth, leftMinPx, rightMinPx],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.getElementById("chat-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const newWidth =
        ((e.clientX - containerRect.left) / containerWidth) * 100;

      const { min, max } = getEffectiveBounds(containerWidth);

      // 최소/최대 범위 제한
      const clampedWidth = Math.min(Math.max(newWidth, min), max);
      setWidth(clampedWidth);
    },
    [isDragging, getEffectiveBounds],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 컨테이너 크기 변화 감지 (사이드바 열림/닫힘 등)
  useEffect(() => {
    const container = document.getElementById("chat-container");
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        if (containerWidth === 0) return;

        const { min, max } = getEffectiveBounds(containerWidth);
        const currentWidth = widthRef.current;

        // 현재 width가 범위를 벗어나면 자동 조정
        if (currentWidth < min) {
          setWidth(min);
        } else if (currentWidth > max) {
          setWidth(max);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [getEffectiveBounds]);

  return { width, isDragging, handleMouseDown };
};
