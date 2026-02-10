import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UploadUrlRequest } from "../types/asset";
import { getUploadUrl, uploadToS3, confirmUpload } from "../api/assetApi";
import { noteKeys } from "@/features/notes/hooks/useNotes";

export const useAssetUpload = () => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false); // 업로드 여부
  const [progress, setProgress] = useState(0); // 업로드 진해률(퍼센트로 나타남)

  // 파일을 업로드 시키는 함수!
  const uploadAsset = async (noteId: number, file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const requestParams: UploadUrlRequest = {
        noteId: noteId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      };

      // 1. Presigned URL 발급 API 호출
      const uploadUrlResponse = await getUploadUrl(requestParams);
      const { uploadUrl, assetId } = uploadUrlResponse.result;

      // 2. S3에 파일 업로드 (진행률 반영, assetApi 사용)
      await uploadToS3(uploadUrl, file, (percentage) => {
        setProgress(percentage);
      });

      // 3. 서버에 업로드 완료 확정 알림 (assetApi 사용)
      const confirmResponse = await confirmUpload(assetId);
      console.log("서버 업로드 확정 완료:", confirmResponse.message);

      // 쿼리 무효화 (노트 상세 정보 갱신 -> StorageContent 목록 업데이트)
      queryClient.invalidateQueries({
        queryKey: noteKeys.detail(String(noteId)),
      });

      // 4. 업로드 성공 후 반환
      return confirmResponse.result;
    } catch (error) {
      console.error("업로드 과정 중 오류 발생:", error);
      throw error;
    } finally {
      // 5. 파일 업로드 완료 후 로딩 상태 해제
      setIsUploading(false);
    }
  };

  return { uploadAsset, isUploading, progress };
};
