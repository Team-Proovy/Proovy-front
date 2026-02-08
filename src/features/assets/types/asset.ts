import type { ApiResponse } from "@/shared/api/shared_types";

/**
 * OCR 추출 텍스트 구조
 * ocrStatus가 'completed'일 때만 포함된다.
 */
export interface OcrText {
  pages: {
    page: number; // 페이지 번호
    text: string; // 해당 페이지의 추출 텍스트
  }[];
  fullText: string; // 전체 텍스트 (페이지 구분 포함)
  model: string; // 사용된 OCR 모델명 (예: PaddleOCR-VL)
}

/**
 * 1. Presigned URL 발급 요청 데이터 (업로드용)
 */
export interface UploadUrlRequest {
  noteId: number; // 파일이 속할 노트 ID
  fileName: string; // 파일명 (확장자 포함)
  mimeType: string; // MIME 타입
  fileSize: number; // 파일 크기 (1 이상 30MB 이하)
}

/**
 * 2. Presigned URL 발급 응답 데이터 (업로드용)
 */
export interface UploadUrlResponseData {
  assetId: number; // 업로드 완료 확인 시 사용될 ID
  uploadUrl: string; // S3 직접 업로드를 위한 URL
  expiresAt: string; // URL 만료 시각
}

/**
 * 3. 자산 상세 정보 응답 데이터 (GET /assets/{assetId})
 * 특정 자산의 상세 정보와 OCR 결과를 포함한다.
 */
export interface AssetDetailResponseData {
  assetId: number; // 자산 고유 ID
  noteId?: number; // 소속 노트 ID
  source: "upload" | "ai_generated"; // 파일 출처
  fileName: string; // 파일명
  fileSize: number; // 파일 크기 (bytes)
  mimeType: string; // MIME 타입
  fileCategory?: "image" | "document" | "code" | "other"; // 파일 카테고리
  thumbnailUrl?: string | null; // 썸네일 URL
  totalPages?: number; // 총 페이지 수 (PDF/PPT인 경우 포함)
  ocrStatus: "pending" | "processing" | "completed" | "failed"; // OCR 처리 상태
  ocrText?: OcrText; // OCR 추출 텍스트 (completed 상태일 때만 포함)
  ocrProcessedAt?: string; // OCR 처리 완료 시각
  createdAt: string; // 자산 생성 시각
}

/**
 * 전체 저장소 사용량 및 현황 데이터
 * GET /api/storage 응답
 */
export interface StorageResponseData {
  totalUsed: number;
  totalLimit: number;
  totalUsedDisplay: string;
  totalLimitDisplay: string;
  usagePercent: number;
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

/**
 * 일괄 삭제 요청 (최대 30개)
 */
export interface BulkDeleteRequest {
  assetIds: number[];
}

/**
 * 일괄 삭제 응답 데이터
 */
export interface BulkDeleteResponseData {
  deletedCount: number;
  deletedAssetIds: number[];
}

/**
 * 4. 자산 다운로드용 Presigned URL 발급 응답 데이터 (GET /assets/{assetId}/download)
 */
export interface DownloadUrlResponseData {
  assetId: number; // 자산 고유 ID
  fileName: string; // 다운로드 시 사용될 파일명
  downloadUrl: string; // S3 Presigned URL (GET 요청으로 다운로드)
  expiresAt: string; // 다운로드 URL 만료 시각 (발급 후 15분)
}

// 공통 API 응답 타입
export type UploadUrlResponse = ApiResponse<UploadUrlResponseData>;
export type ConfirmUploadResponse = ApiResponse<AssetDetailResponseData>;
export type AssetDetailResponse = ApiResponse<AssetDetailResponseData>;
export type DownloadUrlResponse = ApiResponse<DownloadUrlResponseData>;
export type DeleteAssetResponse = ApiResponse<null>;
export type StorageResponse = ApiResponse<StorageResponseData>;
export type BulkDeleteResponse = ApiResponse<BulkDeleteResponseData>;
