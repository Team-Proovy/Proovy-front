import { useState, useCallback } from "react";

interface UseCanvasOverlayOptions {
  viewerRef?: React.RefObject<HTMLElement | null>;
  inputRef: React.RefObject<HTMLDivElement | null>;
}

interface UseCanvasOverlayReturn {
  isCanvasOpen: boolean;
  viewerRect: DOMRect | null;
  handleCanvasToggle: () => void;
  insertCanvasImage: (blob: Blob) => void;
  closeCanvas: () => void;
}

/**
 * 캔버스 오버레이 관리 훅
 * - 캔버스 열기/닫기
 * - 뷰어 영역 계산
 * - 캡처한 이미지를 채팅 입력창에 삽입
 */
export const useCanvasOverlay = ({
  viewerRef,
  inputRef,
}: UseCanvasOverlayOptions): UseCanvasOverlayReturn => {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [viewerRect, setViewerRect] = useState<DOMRect | null>(null);

  const handleCanvasToggle = useCallback(() => {
    if (isCanvasOpen) {
      setIsCanvasOpen(false);
      setViewerRect(null);
    } else {
      // 뷰어 영역이 있으면 그 위치 계산
      if (viewerRef?.current) {
        const rect = viewerRef.current.getBoundingClientRect();
        setViewerRect(rect);
      }
      setIsCanvasOpen(true);
    }
  }, [isCanvasOpen, viewerRef]);

  const closeCanvas = useCallback(() => {
    setIsCanvasOpen(false);
    setViewerRect(null);
  }, []);

  // 캔버스에서 캡처한 이미지를 채팅 입력창에 삽입
  const insertCanvasImage = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.onload = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
      img.alt = "Canvas drawing";
      img.style.cssText =
        "max-width: 200px; max-height: 150px; border-radius: 8px; margin: 4px 0;";

      // 현재 커서 위치에 삽입
      if (inputRef.current) {
        inputRef.current.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          // 커서를 이미지 뒤로 이동
          range.setStartAfter(img);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          inputRef.current.appendChild(img);
        }
      }

      setIsCanvasOpen(false);
      setViewerRect(null);
    },
    [inputRef],
  );

  return {
    isCanvasOpen,
    viewerRect,
    handleCanvasToggle,
    insertCanvasImage,
    closeCanvas,
  };
};
