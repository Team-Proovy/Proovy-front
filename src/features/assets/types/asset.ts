import type { ApiResponse } from "@/shared/api/shared_types";

/**
 * 1. Presigned URL 발급 요청 데이터 (명세서 p.2 참고)
 */
export interface UploadUrlRequest {
  noteId: number; // 파일이 속할 노트 ID
  fileName: string; // 파일명 (확장자 포함)
  mimeType: string; // MIME 타입 (application/pdf, image/png 등)
  fileSize: number; // 파일 크기 (1 이상 30MB 이하)
}

/**
 * 2. Presigned URL 발급 응답 데이터 (명세서 p.2 참고)
 */
export interface UploadUrlResponseData {
  assetId: number; // 업로드 완료 확인 시 사용될 ID
  uploadUrl: string; // S3 직접 업로드를 위한 URL
  expiresAt: string; // URL 만료 시각
}

// 3. S3 업로드 완료 알림 응답 데이터 
export interface ConfirmUploadResponseData {
  assetId: number;      // 자산 고유 ID 
  fileName: string;    // 파일명 
  fileSize: number;    // 파일 크기 (bytes) 
  mimeType: string;    // MIME 타입 
  source: string;      // 파일 출처 (upload 등) 
  ocrStatus: "pending" | "processing" | "completed" | "failed"; // OCR 처리 상태 
  createdAt: string;   // 자산 생성 시각 
}

export type UploadUrlResponse = ApiResponse<UploadUrlResponseData>;
export type ConfirmUploadResponse = ApiResponse<ConfirmUploadResponseData>;
