import { useState, useCallback, useEffect, useRef } from "react";

interface UseResizableOptions {
  initialWidth: number; // 초기 너비 (%)
  minWidth?: number; // 최소 너비 (%)
  maxWidth?: number; // 최대 너비 (%)
  minWidthPx?: number; // 최소 너비 (px) - 이 값이 있으면 % 보다 우선
  maxWidthPx?: number; // 최대 너비 (px) - 이 값이 있으면 % 보다 우선
}

interface UseResizableReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export const useResizable = ({
  initialWidth,
  minWidth = 20,
  maxWidth = 80,
  minWidthPx,
  maxWidthPx,
}: UseResizableOptions): UseResizableReturn => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const widthRef = useRef(width);

  // width 변경 시 ref 업데이트
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

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

      // 픽셀 기반 최소/최대 너비를 % 로 변환
      const effectiveMinWidth = minWidthPx
        ? Math.max(minWidth, (minWidthPx / containerWidth) * 100)
        : minWidth;
      const effectiveMaxWidth = maxWidthPx
        ? Math.min(maxWidth, (maxWidthPx / containerWidth) * 100)
        : maxWidth;

      // 최소/최대 범위 제한
      const clampedWidth = Math.min(
        Math.max(newWidth, effectiveMinWidth),
        effectiveMaxWidth,
      );
      setWidth(clampedWidth);
    },
    [isDragging, minWidth, maxWidth, minWidthPx, maxWidthPx],
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

        // 현재 width(%)가 minWidthPx보다 작으면 자동 조정
        const currentWidthPx = (widthRef.current / 100) * containerWidth;
        if (minWidthPx && currentWidthPx < minWidthPx) {
          const newWidth = (minWidthPx / containerWidth) * 100;
          setWidth(Math.min(newWidth, maxWidth));
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [minWidthPx, maxWidth]);

  return { width, isDragging, handleMouseDown };
};
