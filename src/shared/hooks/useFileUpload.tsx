import { useRef, useCallback } from "react";

/**
 * 컴포넌트 내부가 아닌 곳에서 파일 업로드 로직을 재사용하기 위한 커스텀 훅
 * @param onFileSelect 파일 선택 시 호출되는 콜백 함수
 * @param accept 허용되는 파일 타입
 * @returns { openFileExplorer, fileInputRef, handleFileChange }
 */
export const useFileUpload = (
  onFileSelect?: (file: File) => void,
  accept?: string,
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 파일 탐색기 열기 (input 태그 클릭 유도)
  const openFileExplorer = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 2. 파일 선택 시 이벤트 로직
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        console.log("선택된 파일:", file.name);
        if (onFileSelect) {
          onFileSelect(file);
        }
      }
      // 동일 파일 재선택 가능하도록 초기화
      event.target.value = "";
    },
    [onFileSelect],
  );

  return {
    fileInputRef,
    openFileExplorer,
    handleFileChange,
    accept,
  };
};
