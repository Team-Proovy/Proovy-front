import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UploadUrlRequest } from "../types/asset";
import { getUploadUrl, uploadToS3, confirmUpload } from "../api/assetApi";
import { noteKeys } from "@/features/notes/hooks/useNotes";
import { assetKeys } from "@/features/storage/hooks/useAssets";

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
      console.log("✅ 업로드 확정 완료:", {
        assetId,
        fileName: confirmResponse.result.fileName,
        ocrStatus: confirmResponse.result.ocrStatus,
        thumbnailUrl: confirmResponse.result.thumbnailUrl,
      });

      // 쿼리 즉시 갱신 (invalidate가 아닌 refetch 사용)
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: noteKeys.detail(String(noteId)),
        }),
        queryClient.refetchQueries({
          queryKey: assetKeys.storage,
        }),
      ]);

      console.log("✅ 쿼리 갱신 완료");

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
