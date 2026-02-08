import { useState } from "react";
import { createPortal } from "react-dom";
// @ts-ignore - tldraw types
import { Editor } from "tldraw";
import { CanvasBoard } from "./CanvasBoard";

interface CanvasOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (blob: Blob) => void;
}

export const CanvasOverlay = ({
  isOpen,
  onClose,
  onAdd,
}: CanvasOverlayProps) => {
  const [editor, setEditor] = useState<Editor | null>(null);

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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col bg-white">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-2">
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
