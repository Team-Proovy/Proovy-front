import type { ApiResponse } from "@/shared/api/shared_types";

// ============================================================
// 도구 (Tool) 관련 타입
// ============================================================

/** 도구 아이콘 타입 */
export type ToolIconType = "chart_line" | "file_text" | "copy_plus" | string;

/** 도구 정보 */
export interface ToolDto {
  toolId: number;
  toolCode: string;
  name: string;
  description: string;
  iconType: ToolIconType;
  isActive: boolean;
  displayOrder: number;
}

/** 도구 목록 응답 */
export interface ToolListResult {
  tools: ToolDto[];
}

/** 도구 목록 조회 파라미터 */
export interface ToolListParams {
  query?: string;
}

// ============================================================
// 에셋/파일 (Asset) 관련 타입 - 채팅 멘션용
// ============================================================

/** 파일 유형 */
export type FileType = "PDF" | "DOCX" | "IMAGE" | "CODE" | string;

/** 파일 출처 */
export type AssetSource = "UPLOAD" | "GENERATED";

/** OCR 상태 */
export type OcrStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

/** 채팅 멘션용 에셋 정보 */
export interface ChatAssetDto {
  assetId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
  source: AssetSource;
  ocrStatus: OcrStatus;
  thumbnailUrl: string | null;
  createdAt: string;
}

/** 에셋 목록 응답 */
export interface ChatAssetListResult {
  assets: ChatAssetDto[];
  totalCount: number;
}

/** 에셋 목록 조회 파라미터 */
export interface ChatAssetListParams {
  noteId: number;
  query?: string;
}

// ============================================================
// 대화 (Conversation) 관련 타입
// ============================================================

/** 대화 생성 요청 */
export interface CreateConversationRequest {
  text: string;
  latex?: string;
  mentionedAssetIds?: number[];
  chosenFeatures?: string[];
  canvasImageIds?: number[];
}

/** 대화 생성 파라미터 */
export interface CreateConversationParams {
  isStream?: boolean;
}

/** 대화 생성 응답 (비-스트리밍) */
export interface ConversationResponseDto {
  conversationId: number;
  userMessage: {
    messageId: number;
    content: string;
    mentionedAssets: { assetId: number; fileName: string }[];
    mentionedTools: string[];
    createdAt: string;
  };
  assistantMessage: {
    messageId: number;
    content: string;
    usedTools: string[];
    status: string;
    createdAt: string;
  };
}

// ============================================================
// API 응답 타입 별칭
// ============================================================

export type ToolListResponse = ApiResponse<ToolListResult>;
export type ChatAssetListResponse = ApiResponse<ChatAssetListResult>;
