import { useState, useEffect, useRef } from "react";
import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { isFileAllowed } from "@/features/assets/utils/fileValidation";

/**
 * 뷰어 파일 미리보기 관리 훅
 *
 * - 파일 선택 → Blob URL 생성 → 미리보기 표시
 * - Blob URL 메모리 누수 방지 (pdfUrl 변경·언마운트 시 revoke)
 * - viewerFileRef를 외부(useHomeSend)와 공유
 */
export const useViewerFile = (
  viewerFileRef: React.MutableRefObject<File | null>,
) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  // Blob URL 메모리 누수 방지
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== pdfUrl) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = pdfUrl;
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const {
    fileInputRef,
    openFileExplorer,
    handleFileChange,
    isDragging,
    dragProps,
  } = useFileUpload((file) => {
    if (file && isFileAllowed(file)) {
      setFileName(file.name);
      viewerFileRef.current = file;
      setPdfUrl(URL.createObjectURL(file));
      // 파일 크기나 형식 검증은 isFileAllowed에서 처리하지만,
      // 추가적인 검증이 필요하면 여기서 처리.
      // 하지만 isFileAllowed는 boolean만 반환.

      // 파일 선택 시 note 생성을 바로 하진 않음.
    }
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setFileName("");
    viewerFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    pdfUrl,
    fileName,
    fileInputRef,
    openFileExplorer,
    handleFileChange,
    handleRemove,
    isDragging,
    dragProps,
  };
};
