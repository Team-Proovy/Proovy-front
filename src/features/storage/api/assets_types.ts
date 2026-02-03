// ============================================================
// 요청 (Request) 타입
// ============================================================

/** 업로드 URL 발급 요청 */
export interface UploadUrlRequest {
  noteId: number;
  fileName: string;
  mimeType: string;
  /** 파일 크기 (bytes), 최대 31,457,280 (30MB) */
  fileSize: number;
}

/** 자산 일괄 삭제 요청 */
export interface BulkDeleteRequest {
  /** 최대 30개 */
  assetIds: number[];
}

// ============================================================
// 응답 (Response) 타입
// ============================================================

/** 업로드 URL 발급 응답 */
export interface UploadUrlResponse {
  assetId: number;
  uploadUrl: string;
  expiresAt: string;
}

/** 업로드 확인 응답 */
export interface UploadConfirmResponse {
  assetId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  source: string;
  ocrStatus: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

/** 페이지별 OCR 텍스트 */
export interface PageText {
  page: number;
  text: string;
}

/** OCR 텍스트 정보 */
export interface OcrTextDto {
  pages: PageText[];
  fullText: string;
  model: string;
}

/** 자산 상세 정보 응답 */
export interface AssetDetailResponse {
  assetId: number;
  noteId: number;
  source: "upload" | "ai_generated";
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalPages: number | null;
  ocrStatus: "pending" | "processing" | "completed" | "failed";
  ocrText: OcrTextDto | null;
  ocrProcessedAt: string | null;
  createdAt: string;
}

/** 다운로드 URL 응답 */
export interface DownloadUrlResponse {
  assetId: number;
  fileName: string;
  downloadUrl: string;
  expiresAt: string;
}

/** 일괄 삭제 응답 */
export interface BulkDeleteResponse {
  deletedCount: number;
  deletedAssetIds: number[];
}

// ============================================================
// API 함수용 타입 (alias)
// ============================================================

/** Presigned URL 응답 */
export interface PresignedUrlResponse {
  presignedUrl: string;
  assetId: string;
}

/** 업로드 확인 요청 */
export interface UploadConfirmRequest {
  assetId: string;
  filename: string;
  contentType: string;
  size: number;
}

/** 에셋 상세 정보 (API 응답용) */
export type AssetDetail = AssetDetailResponse;

/** 에셋 삭제 요청 */
export interface AssetDeleteRequest {
  assetIds: string[];
}
