// 1. Presigned URL 발급 요청 데이터
export interface UploadUrlRequest {
  noteId: number;     // 파일이 속할 노트 ID
  fileName: string;   // 확장자 포함 파일명
  mimeType: string;   // 파일 타입
  fileSize: number;   // 파일 크기
}

// 2. 서버 응답 공통 형식
export interface BaseResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

// 3. Presigned URL 발급 응답 데이터
export interface UploadUrlResponseData {
  assetId: number;    // 업로드 대상 자산 ID
  uploadUrl: string;  // S3 PUT 요청용 URL
  expiresAt: string;  // URL 만료 시각
}

export type UploadUrlResponse = BaseResponse<UploadUrlResponseData>;