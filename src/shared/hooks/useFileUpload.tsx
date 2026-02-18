import { useRef, useCallback, useState } from "react";

/**
 * 컴포넌트 내부가 아닌 곳에서 파일 업로드 로직을 재사용하기 위한 커스텀 훅
 * @param onFileSelect 파일 선택 시 호출되는 콜백 함수
 * @param accept 허용되는 파일 타입
 * @returns { openFileExplorer, fileInputRef, handleFileChange, isDragging, dragProps }
 */
export const useFileUpload = (
  onFileSelect?: (file: File) => void,
  accept?: string,
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // 1. 파일 탐색기 열기 (input 태그 클릭 유도)
  const openFileExplorer = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 2. 파일 선택 시 이벤트 로직 (Input Change)
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (onFileSelect) {
          onFileSelect(file);
        }
      }
      // 동일 파일 재선택 가능하도록 초기화
      event.target.value = "";
    },
    [onFileSelect],
  );

  // 3. 드래그 앤 드롭 이벤트 핸들러
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 파일 드래그가 아니면 무시 (텍스트 선택, 내부 이미지 드래그 등)
    if (!e.dataTransfer.types.includes("Files")) {
      return;
    }

    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 파일 드래그가 아니면 무시 (Enter와 대칭 유지)
    if (!e.dataTransfer.types.includes("Files")) {
      return;
    }

    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 드롭 가능 표시
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (onFileSelect) {
          onFileSelect(file);
        }
        e.dataTransfer.clearData();
      }
    },
    [onFileSelect],
  );

  return {
    fileInputRef,
    openFileExplorer,
    handleFileChange,
    accept,
    isDragging,
    dragProps: {
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
    },
  };
};
