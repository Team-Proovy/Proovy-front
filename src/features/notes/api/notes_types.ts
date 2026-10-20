import { type PageInfo } from "../../../shared/api/shared_types";

// ============================================================
// 요청 (Request) 타입
// ============================================================

/** 노트 목록 조회 파라미터 */
export interface NoteListParams {
  page?: number;
  size?: number;
  cursor?: string;
  sort?: "lastUsedAt,desc" | "createdAt,desc" | "title,asc";
}

/** 노트 제목 변경 요청 */
export interface UpdateNoteTitleRequest {
  title: string;
}

// ============================================================
// 응답 (Response) 타입
// ============================================================

/** 노트 제목 변경 응답 */
export interface UpdateNoteTitleResponse {
  noteId: number;
  title: string;
  updatedAt: string;
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

// ============================================================
// 노트 상세 (NoteDetail) 타입  —  GET /api/notes/{noteId}
// ============================================================

/** 노트 상세 조회 파라미터 */
export interface NoteDetailParams {
  conversationPage?: number;
  conversationSize?: number;
}

/** 대화 사용량 정보 */
export interface UsageInfo {
  conversationCount: number;
  conversationLimit: number;
  conversationUsagePercent: number;
}

/** 첨부 파일 정보 */
export interface AssetInfo {
  assetId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  ocrStatus: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

/** 멘션된 자산 (대화 내역용) */
export interface MentionedAsset {
  assetId: number;
  fileName: string;
}

/** 생성된 파일 */
export interface GeneratedFile {
  fileId: number;
  fileName: string;
  fileType: string;
  downloadUrl: string;
}

/** 메시지 정보 (대화 내역용) */
export interface MessageInfo {
  messageId: number;
  content: string;
  mentionedAssets: MentionedAsset[];
  mentionedTools: string[];
  usedTools: string[];
  generatedFiles: GeneratedFile[];
  createdAt: string;
}

/** 대화 정보 */
export interface ConversationInfo {
  conversationId: number;
  userMessage: MessageInfo;
  assistantMessage: MessageInfo;
  createdAt: string;
}

/** 노트 상세 응답 (채팅방 진입 시) */
export interface NoteDetailResponse {
  noteId: number;
  title: string;
  usage: UsageInfo;
  assets: AssetInfo[];
  conversations: ConversationInfo[];
  conversationPageInfo: PageInfo;
  createdAt: string;
  lastUsedAt: string;
}

// ============================================================
// 삭제 관련 응답 타입
// ============================================================

/** 벌크 삭제 응답 */
export interface DeleteNotesBulkResult {
  deletedCount: number;
  deletedNoteIds: number[];
  failedNoteIds?: number[];
  failedReasons?: { noteId: number; message: string }[];
}

/** 단일 삭제 응답 */
export interface DeleteNoteResult {
  deletedNoteId: number;
  deletedConversationCount: number;
  deletedAssetCount: number;
  freedStorageBytes: number;
}
