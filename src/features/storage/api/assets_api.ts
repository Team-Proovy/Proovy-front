import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  UploadUrlRequest,
  UploadUrlResponse,
  UploadConfirmResponse,
  AssetDetailResponse,
  DownloadUrlResponse,
  BulkDeleteRequest,
  BulkDeleteResponse,
} from "./assets_types";

const ASSETS_BASE = "/api/assets";

// 업로드 URL 발급
export const getUploadUrl = async (
  data: UploadUrlRequest,
): Promise<ApiResponse<UploadUrlResponse>> => {
  const response = await apiClient.post<ApiResponse<UploadUrlResponse>>(
    `${ASSETS_BASE}/upload-url`,
    data,
  );
  return response.data;
};

// 업로드 완료 확인
export const confirmUpload = async (
  assetId: number,
): Promise<ApiResponse<UploadConfirmResponse>> => {
  const response = await apiClient.post<ApiResponse<UploadConfirmResponse>>(
    `${ASSETS_BASE}/${assetId}/confirm`,
  );
  return response.data;
};

// 에셋 상세 조회
export const getAssetDetail = async (
  assetId: number,
): Promise<ApiResponse<AssetDetailResponse>> => {
  const response = await apiClient.get<ApiResponse<AssetDetailResponse>>(
    `${ASSETS_BASE}/${assetId}`,
  );
  return response.data;
};

// 다운로드 URL 발급
export const getDownloadUrl = async (
  assetId: number,
): Promise<ApiResponse<DownloadUrlResponse>> => {
  const response = await apiClient.get<ApiResponse<DownloadUrlResponse>>(
    `${ASSETS_BASE}/${assetId}/download-url`,
  );
  return response.data;
};

// 에셋 삭제 (단일)
export const deleteAsset = async (
  assetId: number,
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `${ASSETS_BASE}/${assetId}`,
  );
  return response.data;
};

// 에셋 삭제 (벌크)
export const deleteAssetsBulk = async (
  data: BulkDeleteRequest,
): Promise<ApiResponse<BulkDeleteResponse>> => {
  const response = await apiClient.delete<ApiResponse<BulkDeleteResponse>>(
    `${ASSETS_BASE}/bulk`,
    { data },
  );
  return response.data;
};
