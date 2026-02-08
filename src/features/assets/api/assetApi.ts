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

/** 2. Presigned URL 발급 API (POST) */
export const getUploadUrl = async (
  params: UploadUrlRequest,
): Promise<UploadUrlResponse> => {
  const response = await apiClient.post<UploadUrlResponse>(
    "/api/assets/upload-url",
    params,
  );
  return response.data;
};

/** 3. S3 직접 업로드 함수 (PUT) */
export const uploadToS3 = async (
  uploadUrl: string,
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (e) => {
      if (e.total) {
        const percentage = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percentage);
      }
    },
  });
};

/** 4. S3 업로드 완료 알림 API (POST)*/
export const confirmUpload = async (
  assetId: number,
): Promise<ConfirmUploadResponse> => {
  const response = await apiClient.post<ConfirmUploadResponse>(
    `/api/assets/${assetId}/confirm`,
  );
  return response.data;
};

/** 5. 자산 상세 정보 조회 (GET) */
export const getAssetDetail = async (
  assetId: number,
): Promise<AssetDetailResponse> => {
  const response = await apiClient.get<AssetDetailResponse>(
    `/api/assets/${assetId}`,
  );
  return response.data;
};

/** 6. 자산 다운로드용 URL 발급 (GET) */
export const getDownloadUrl = async (
  assetId: number,
): Promise<DownloadUrlResponse> => {
  const response = await apiClient.get<DownloadUrlResponse>(
    `/api/assets/${assetId}/download`,
  );
  return response.data;
};

/** 7. 자산 단일 삭제 (DELETE) */
export const deleteAsset = async (
  assetId: number,
): Promise<DeleteAssetResponse> => {
  const response = await apiClient.delete<DeleteAssetResponse>(
    `/api/assets/${assetId}`,
  );
  return response.data;
};

/** 8. 자산 일괄 삭제 (DELETE) */
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
