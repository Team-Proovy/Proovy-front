import type { ApiResponse } from "@/shared/api/shared_types";

/** * 1. OCR 추출 텍스트 구조 */
export interface OcrText {
  pages: {
    page: number;
    text: string;
  }[];
  fullText: string;
  model: string;
}

/** * 2. 업로드/상세 정보 공통 구조 */
export interface AssetDetailResponseData {
  assetId: number;
  noteId?: number;
  source: "upload" | "ai_generated";
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileCategory?: "image" | "document" | "code" | "other"; // 추가
  thumbnailUrl?: string | null; // 추가
  totalPages?: number;
  ocrStatus: "pending" | "processing" | "completed" | "failed";
  ocrText?: OcrText;
  ocrProcessedAt?: string;
  createdAt: string;
}

/** * 3. 전체 저장소 사용량 및 현황 데이터 */
export interface StorageResponseData {
  totalUsed: number;
  totalLimit: number;
  totalUsedDisplay: string;
  totalLimitDisplay: string;
  usagePercent: number; // 90 이상 시 업그레이드 권장
  plan: {
    planType: "free" | "premium";
    isActive: boolean;
  };
  notes: {
    noteId: number;
    title: string;
    storageUsed: number;
    storageLimit: number;
    storageUsedDisplay: string;
    storageLimitDisplay: string;
    assets: AssetDetailResponseData[];
  }[];
}

/** * 4. 요청(Request) 관련 데이터
 */
export interface UploadUrlRequest {
  noteId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface BulkDeleteRequest {
  assetIds: number[]; // 1개 이상 30개 이하
}

/** * 5. 기타 응답 데이터
 */
export interface UploadUrlResponseData {
  assetId: number;
  uploadUrl: string;
  expiresAt: string;
}

export interface DownloadUrlResponseData {
  assetId: number;
  fileName: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface BulkDeleteResponseData {
  deletedCount: number;
  deletedAssetIds: number[];
}

// ============================================================
// 공통 API 응답 타입 (Wrapper)
// ============================================================
export type StorageResponse = ApiResponse<StorageResponseData>;
export type UploadUrlResponse = ApiResponse<UploadUrlResponseData>;
export type ConfirmUploadResponse = ApiResponse<AssetDetailResponseData>;
export type AssetDetailResponse = ApiResponse<AssetDetailResponseData>;
export type DownloadUrlResponse = ApiResponse<DownloadUrlResponseData>;
export type BulkDeleteResponse = ApiResponse<BulkDeleteResponseData>;
export type DeleteAssetResponse = ApiResponse<null>;
