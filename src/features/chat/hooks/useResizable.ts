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
  handleTouchStart: (e: React.TouchEvent) => void;
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
  const rafRef = useRef<number | null>(null); // requestAnimationFrame ID
  const pendingClientXRef = useRef<number | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);

  // width 변경 시 ref 업데이트
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  // 유효한 min/max 계산 함수
  const getEffectiveBounds = useCallback(
    (containerWidth: number) => {
      // 왼쪽 패널 최소 너비 (%)
      let leftMinPercent = leftMinPx
        ? Math.max(minWidth, (leftMinPx / containerWidth) * 100)
        : minWidth;

      // 오른쪽 패널 최소 너비를 고려한 왼쪽 패널 최대 너비 (%)
      const rightMinPercent = rightMinPx
        ? (rightMinPx / containerWidth) * 100
        : 0;
      const maxFromRight = 100 - rightMinPercent;
      const leftMaxPercent = Math.min(maxWidth, maxFromRight);

      // 충돌 해결: leftMinPercent > leftMaxPercent인 경우
      // 오른쪽 패널 최소 너비를 우선시하여 왼쪽 최소 너비를 줄임
      if (leftMinPercent > leftMaxPercent) {
        leftMinPercent = leftMaxPercent;
      }

      return { min: leftMinPercent, max: leftMaxPercent };
    },
    [minWidth, maxWidth, leftMinPx, rightMinPx],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch) return;
    activeTouchIdRef.current = touch.identifier;
    setIsDragging(true);
  }, []);

  const calcNewWidth = useCallback(
    (clientX: number) => {
      pendingClientXRef.current = clientX;

      // 이미 RAF가 예약된 경우 스킵 — 프레임당 1번만 setWidth 호출
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const latestClientX = pendingClientXRef.current;
        pendingClientXRef.current = null;
        if (latestClientX === null) return;

        const container = document.getElementById("chat-container");
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        if (containerWidth === 0) return;

        const newWidth =
          ((latestClientX - containerRect.left) / containerWidth) * 100;
        const { min, max } = getEffectiveBounds(containerWidth);
        setWidth(Math.min(Math.max(newWidth, min), max));
      });
    },
    [getEffectiveBounds],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      calcNewWidth(e.clientX);
    },
    [isDragging, calcNewWidth],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // 드래그 중 스크롤 방지
      const activeTouchId = activeTouchIdRef.current;
      if (activeTouchId === null) return;

      const touch =
        Array.from(e.touches).find(
          (candidate) => candidate.identifier === activeTouchId,
        ) ??
        Array.from(e.changedTouches).find(
          (candidate) => candidate.identifier === activeTouchId,
        );
      if (!touch) return;
      calcNewWidth(touch.clientX);
    },
    [isDragging, calcNewWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    activeTouchIdRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false, // preventDefault 허용
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("touchcancel", handleTouchEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // 컨테이너 크기 변화 감지 (사이드바 열림/닫힘 등)
  useEffect(() => {
    const container = document.getElementById("chat-container");
    if (!container) return;

    // 너비에 따른 width 조정 함수
    const adjustWidth = (containerWidth: number) => {
      if (containerWidth === 0) return;

      const { min, max } = getEffectiveBounds(containerWidth);
      const currentWidth = widthRef.current;

      // 현재 width가 범위를 벗어나면 자동 조정
      if (currentWidth < min) {
        setWidth(min);
      } else if (currentWidth > max) {
        setWidth(max);
      }
    };

    // ResizeObserver 지원 여부 확인
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        adjustWidth(entry.contentRect.width);
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // ResizeObserver 미지원 환경: window resize 폴백
      const handleResize = () => {
        const width = container.getBoundingClientRect().width;
        adjustWidth(width);
      };

      // 초기 측정
      handleResize();

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [getEffectiveBounds]);

  return { width, isDragging, handleMouseDown, handleTouchStart };
};
