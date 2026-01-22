import { useState } from "react";
import { createPortal } from "react-dom";
// @ts-ignore - tldraw types
import { Editor } from "tldraw";
import { CanvasBoard } from "./CanvasBoard";

interface CanvasOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (blob: Blob) => void;
  /** 뷰어 영역의 위치/크기 정보 (뷰어가 있는 경우) */
  viewerRect?: DOMRect | null;
}

export const CanvasOverlay = ({
  isOpen,
  onClose,
  onAdd,
  viewerRect,
}: CanvasOverlayProps) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 뷰어가 없으면 항상 전체화면
  const hasViewer = !!viewerRect;
  const effectiveFullscreen = !hasViewer || isFullscreen;

  // 캔버스 캡처 후 채팅창에 추가
  const handleAdd = async () => {
    if (!editor) return;

    try {
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) {
        alert("캔버스에 아무것도 없어요!");
        return;
      }

      // @ts-ignore - toImage exists in tldraw
      const result = await editor.toImage([...shapeIds], {
        format: "png",
        quality: 1,
        scale: 2,
        background: false,
      });

      if (result?.blob) {
        onAdd(result.blob);
        onClose();
      }
    } catch (e) {
      console.error("Canvas capture error:", e);
      alert("캡처 중 오류가 발생했습니다.");
    }
  };

  // 캔버스 취소
  const handleCancel = () => {
    onClose();
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  // 전체화면 모드 스타일
  const fullscreenStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  };

  // 뷰어 하단 절반 모드 스타일
  const viewerHalfStyle: React.CSSProperties = viewerRect
    ? {
        position: "fixed",
        left: viewerRect.left,
        top: viewerRect.top + viewerRect.height / 2,
        width: viewerRect.width,
        height: viewerRect.height / 2,
        zIndex: 9998,
      }
    : fullscreenStyle;

  const containerStyle = effectiveFullscreen
    ? fullscreenStyle
    : viewerHalfStyle;

  return createPortal(
    <div
      style={containerStyle}
      className="flex flex-col bg-white"
    >
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Tldraw 기본 UI의 좌측 툴바가 여기 표시됨 */}
        </div>
        <div className="flex items-center gap-2">
          {/* 전체화면/축소 버튼 (뷰어가 있을 때만) */}
          {hasViewer && (
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
              title={effectiveFullscreen ? "축소" : "전체화면"}
            >
              {effectiveFullscreen ? (
                // 축소 아이콘
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line
                    x1="14"
                    y1="10"
                    x2="21"
                    y2="3"
                  />
                  <line
                    x1="3"
                    y1="21"
                    x2="10"
                    y2="14"
                  />
                </svg>
              ) : (
                // 전체화면 아이콘
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line
                    x1="21"
                    y1="3"
                    x2="14"
                    y2="10"
                  />
                  <line
                    x1="3"
                    y1="21"
                    x2="10"
                    y2="14"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Cancel 버튼 */}
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          {/* Add 버튼 */}
          <button
            onClick={handleAdd}
            className="rounded-lg bg-[#2A6AFF] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1E5AE8]"
          >
            Add
          </button>
        </div>
      </div>

      {/* 캔버스 영역 */}
      <div className="relative flex-1">
        <CanvasBoard
          className="h-full w-full"
          hideUi={false}
          onMount={(app) => {
            setEditor(app);
            // 줌 제한 설정
            app.setCameraOptions({
              zoomSteps: [0.5, 1, 1.25, 1.5, 2, 2.5, 3, 4],
            });
          }}
        />
      </div>
    </div>,
    document.body,
  );
};
