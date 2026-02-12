import axios from "axios";
import apiClient from "@/shared/api/client";
import type {
  UploadUrlRequest,
  UploadUrlResponse,
  ConfirmUploadResponse,
  AssetDetailResponse,
  DownloadUrlResponse,
  DeleteAssetResponse,
  BulkDeleteRequest,
  BulkDeleteResponse,
  StorageResponse,
} from "../types/asset";

/**
 * 1. 전체 저장소 사용량 및 현황 조회 (GET)
 * @param keyword 검색어 (노트 제목, 파일명) - 최소 2자 이상
 */
export const getStorageInfo = async (
  keyword?: string,
): Promise<StorageResponse> => {
  const response = await apiClient.get<StorageResponse>("/api/storage", {
    params: { keyword },
  });
  return response.data;
};

// Presigned URL 발급 API
export const getUploadUrl = async (
  params: UploadUrlRequest,
): Promise<UploadUrlResponse> => {
  const response = await apiClient.post<UploadUrlResponse>(
    "/api/assets/upload-url",
    params,
  );
  return response.data;
};

// S3 직접 업로드 함수
export const uploadToS3 = async (
  uploadUrl: string,
  file: File,
  contentType?: string,
  onProgress?: (percentage: number) => void,
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": (contentType ?? file.type) || "application/octet-stream",
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
    `/api/assets/${assetId}/confirm`,
  );
  return response.data;
};

/**
 * 4. 자산 상세 정보 + OCR 결과 조회 (GET)
 * @description OCR 완료 여부에 따라 ocrText 포함 여부가 결정됨
 */
export const getAssetDetail = async (
  assetId: number,
): Promise<AssetDetailResponse> => {
  // Path Parameter 형식: /api/assets/{assetId}
  const response = await apiClient.get<AssetDetailResponse>(
    `/api/assets/${assetId}`,
  );
  return response.data;
};

/**
 * 5. 자산 다운로드용 Presigned URL 발급 (GET)
 * @description 발급된 URL은 15분간 유효함
 */
export const getDownloadUrl = async (
  assetId: number,
): Promise<DownloadUrlResponse> => {
  // Path Parameter 형식: /api/assets/{assetId}/download
  const response = await apiClient.get<DownloadUrlResponse>(
    `/api/assets/${assetId}/download`,
  );
  return response.data;
};

/**
 * 6. 자산 삭제 (DELETE)
 * @description S3 원본, 썸네일, OCR 데이터를 모두 영구 삭제함
 */
export const deleteAsset = async (
  assetId: number,
): Promise<DeleteAssetResponse> => {
  // DELETE /api/assets/{assetId}
  const response = await apiClient.delete<DeleteAssetResponse>(
    `/api/assets/${assetId}`,
  );
  return response.data;
};

/**
 * 7. 자산 일괄 삭제 (DELETE)
 * @description 최대 30개까지 일괄 삭제 가능
 */
export const deleteAssets = async (
  assetIds: number[],
): Promise<BulkDeleteResponse> => {
  const response = await apiClient.delete<BulkDeleteResponse>(
    "/api/storage/assets",
    {
      data: { assetIds } as BulkDeleteRequest,
    },
  );
  return response.data;
};
