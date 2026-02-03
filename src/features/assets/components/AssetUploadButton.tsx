import React, { useRef } from 'react';
import { useAssetUpload } from '../hooks/useAssetUpload';

interface AssetUploadButtonProps {
  noteId: number; // 어떤 노트에 파일을 올릴지 결정
  onSuccess?: (assetId: number) => void; // 업로드 성공 후 리스트 갱신 등을 위한 콜백
}

export const AssetUploadButton = ({ noteId, onSuccess }: AssetUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAsset, isUploading, progress } = useAssetUpload();

  // 버튼을 누르면 숨겨진 input이 클릭되게 함
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 훅의 메인 함수 실행 (검증 -> URL요청 -> S3업로드 -> 서버확인)
      const assetInfo = await uploadAsset(noteId, file);
      
      if (assetInfo) {
        onSuccess?.(assetInfo.assetId);
      }
    } catch (error) {
      // 에러는 훅 내부에서 alert으로 띄우도록 설계했으므로 추가 로직 생략 가능 [cite: 2026-02-02]
    } finally {
      // 다음 업로드를 위해 input 값 초기화
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 실제 파일 선택 창 (숨김 처리) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf, image/png, image/jpeg" // 명세서 지원 형식 반영
      />

      {/* 사용자에게 보이는 업로드 버튼 */}
      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className={`px-4 py-2 rounded-lg font-bold text-white ${
          isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isUploading ? '업로드 중...' : '파일 업로드'}
      </button>

      {/* 진행률 표시 (진행 중일 때만 노출) */}
      {isUploading && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-xs text-center mt-1 text-gray-600">{progress}% 완료</p>
        </div>
      )}
    </div>
  );
};