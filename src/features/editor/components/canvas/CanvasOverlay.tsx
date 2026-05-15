import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { CanvasBoard } from "./CanvasBoard";
import { showErrorToast } from "@/shared/lib/toast";

type CanvasApi = {
  hasContent: () => boolean;
  exportBlob: () => Promise<Blob | null>;
};

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
  const [canvasApi, setCanvasApi] = useState<CanvasApi | null>(null);

  const handleCanvasMount = useCallback((api: CanvasApi) => {
    setCanvasApi(api);
  }, []);

  // 캔버스 캡처 후 채팅창에 추가
  const handleAdd = async () => {
    if (!canvasApi) return;

    try {
      if (!canvasApi.hasContent()) {
        showErrorToast("캔버스에 아무것도 없어요!");
        return;
      }

      const blob = await canvasApi.exportBlob();

      if (blob) {
        onAdd(blob);
        onClose();
        return;
      }

      showErrorToast("캡처된 이미지가 없습니다.");
    } catch (e) {
      console.error("Canvas capture error:", e);
      showErrorToast("캡처 중 오류가 발생했습니다.");
    }
  };

  // 캔버스 취소
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9998 flex flex-col bg-white">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-2">
          {/* Cancel 버튼 */}
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            닫기
          </button>

          {/* Add 버튼 */}
          <button
            onClick={handleAdd}
            className="rounded-lg bg-[#2A6AFF] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1E5AE8]"
          >
            추가
          </button>
        </div>
      </div>

      {/* 캔버스 영역 */}
      <div className="relative flex-1">
        <CanvasBoard
          className="h-full w-full"
          onMount={handleCanvasMount}
        />
      </div>
    </div>,
    document.body,
  );
};
