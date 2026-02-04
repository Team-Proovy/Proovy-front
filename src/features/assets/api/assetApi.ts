import axios from "axios";
import apiClient from "@/shared/api/client";
import type {
  UploadUrlRequest,
  UploadUrlResponse,
  ConfirmUploadResponse,
} from "../types/asset";

// Presigned URL 발급 API
export const getUploadUrl = async (
  params: UploadUrlRequest,
): Promise<UploadUrlResponse> => {
  const response = await apiClient.post<UploadUrlResponse>(
    "/assets/upload-url",
    params,
  );
  return response.data;
};

// S3 직접 업로드 함수
export const uploadToS3 = async (
  uploadUrl: string,
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress: (e) => {
      if (e.total) {
        const percentage = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percentage);
      }
    },
  });
};

/**
 * 3. S3 업로드 완료 알림 API (Step 3)
 * @description 이 API를 호출해야 서버에서 OCR 처리가 시작됨
 */
export const confirmUpload = async (
  assetId: number,
): Promise<ConfirmUploadResponse> => {
  // Path Parameter 형식에 맞춰 URL 구성
  const response = await apiClient.post<ConfirmUploadResponse>(
    `/assets/${assetId}/confirm`,
  );
  return response.data;
};
