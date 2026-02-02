import { type PageInfo } from "../../../shared/api/shared_types";

// ============================================================
// 요청 (Request) 타입
// ============================================================

/** 노트 목록 조회 파라미터 */
export interface NoteListParams {
  page?: number;
  size?: number;
  cursor?: string;
  sort?:
    | "createdAt,desc"
    | "createdAt,asc"
    | "lastUsedAt,desc"
    | "lastUsedAt,asc";
}

/** 새 노트 생성 요청 */
export interface CreateNoteRequest {
  firstMessage: string;
  mentionedAssetIds?: number[];
  mentionedToolCodes?: string[];
}

// ============================================================
// 응답 (Response) 타입
// ============================================================

/** 멘션된 자산 정보 */
export interface MentionedAssetDto {
  assetId: number;
  fileName: string;
}

/** 사용자 메시지 */
export interface UserMessageDto {
  messageId: number;
  content: string;
  mentionedAssets: MentionedAssetDto[];
  mentionedTools: string[];
  createdAt: string;
}

/** AI 응답 메시지 */
export interface AssistantMessageDto {
  messageId: number;
  content: string;
  usedTools: string[];
  status: string;
  createdAt: string;
}

/** 첫 번째 대화 */
export interface FirstConversationDto {
  conversationId: number;
  userMessage: UserMessageDto;
  assistantMessage: AssistantMessageDto;
}

/** 새 노트 생성 응답 */
export interface CreateNoteResponse {
  noteId: number;
  title: string;
  titleGeneratedBy: string;
  conversationLimit: number;
  firstConversation: FirstConversationDto;
  createdAt: string;
}

/** 노트 정보 (목록용) */
export interface NoteDto {
  noteId: number;
  title: string;
  thumbnailUrl: string | null;
  conversationCount: number;
  conversationLimit: number;
  conversationUsagePercent: number;
  assetCount: number;
  createdAt: string;
  lastUsedAt: string;
}

/** 노트 목록 응답 */
export interface NoteListResponse {
  notes: NoteDto[];
  pageInfo: PageInfo;
}
