import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStorageStore } from "@/features/storage/store/useStorageStore";

/**
 * 뷰어 상태 동기화 및 전역 이벤트 핸들링 훅
 *
 * 역할:
 * 1. URL searchParams의 'file' 파라미터와 전역 스토어(viewerFileId) 동기화
 * 2. ESC 키 입력 시 뷰어 닫기 (스토어 및 URL 초기화)
 */
export const useViewerSync = (urlFileId?: string) => {
  const [, setSearchParams] = useSearchParams();
  const { viewerFileId, setViewerFileId } = useStorageStore();

  // 1. URL의 fileId가 있으면 스토어 업데이트 (딥링크/새로고침 지원)
  useEffect(() => {
    if (urlFileId) {
      const parsedId = parseInt(urlFileId, 10);
      if (!isNaN(parsedId) && parsedId !== viewerFileId) {
        setViewerFileId(parsedId);
      }
    }
  }, [urlFileId, setViewerFileId, viewerFileId]);

  // 2. ESC 키 핸들러: 파일 닫기 (스토어 + URL 초기화)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewerFileId(null); // 스토어 초기화
        setSearchParams(
          (prev) => {
            prev.delete("panel");
            prev.delete("file");
            return prev;
          },
          { replace: true },
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearchParams, setViewerFileId]);

  // 실제 사용할 ID 결정 (스토어 우선, 없으면 URL 파라미터 사용)
  // URL 파라미터는 초기 로드 시 스토어가 비어있을 때 백업으로 사용됨
  const activeFileId =
    viewerFileId || (urlFileId ? parseInt(urlFileId, 10) : null);

  return { activeFileId };
};
