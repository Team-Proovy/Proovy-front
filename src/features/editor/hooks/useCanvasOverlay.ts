import { useState, useCallback } from "react";

interface UseCanvasOverlayReturn {
  isCanvasOpen: boolean;
  handleCanvasToggle: () => void;
  closeCanvas: () => void;
}

/**
 * 캔버스 오버레이 관리 훅
 * - 캔버스 열기/닫기 (항상 전체화면)
 */
export const useCanvasOverlay = (): UseCanvasOverlayReturn => {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  const handleCanvasToggle = useCallback(() => {
    setIsCanvasOpen((prev) => !prev);
  }, []);

  const closeCanvas = useCallback(() => {
    setIsCanvasOpen(false);
  }, []);

  return {
    isCanvasOpen,
    handleCanvasToggle,
    closeCanvas,
  };
};
