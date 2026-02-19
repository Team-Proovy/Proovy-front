import type { ApiResponse, PageInfo } from "@/shared/api/shared_types";

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
export type FileType = "pdf" | "docx" | "image" | "code" | string;

/** 파일 출처 */
export type AssetSource = "upload" | "generated";

/** OCR 상태 */
export type OcrStatus = "pending" | "processing" | "completed" | "failed";

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

// ============================================================
// 대화 (Conversation) 관련 타입
// ============================================================

/** 대화 생성 요청 */
export interface CreateConversationRequest {
  noteId?: number;
  text: string;
  latex?: string;
  mentionedAssetIds?: number[];
  chosenFeatures?: string[];
  canvasImageIds?: number[];
}

/** 대화 생성 파라미터 */
export interface CreateConversationParams {
  isStream?: boolean;
  signal?: AbortSignal;
  streamTokens?: boolean;
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
// 대화 상세 조회 (GET /api/conversations/{conversationId})
// ============================================================

/** 노트 요약 정보 */
export interface NoteInfo {
  noteId: number;
  title: string;
}

/** 멘션된 파일 상세 */
export interface MentionedFileDetail {
  assetId: number;
  fileName: string;
  thumbnailUrl: string | null;
}

/** 캔버스 이미지 정보 */
export interface CanvasImageInfo {
  assetId: number;
  previewUrl: string;
}

/** 사용자 메시지 상세 */
export interface UserMessageDetail {
  messageId: number;
  text: string;
  latex: string | null;
  mentionedFiles: MentionedFileDetail[];
  mentionedTools: string[];
  canvasImages: CanvasImageInfo[];
  createdAt: string;
}

/** 섹션 정보 (AI 응답 구조화) */
export interface SectionInfo {
  type: string;
  title: string;
  content: string;
}

/** 코드 실행 정보 */
export interface CodeExecutionInfo {
  status: string;
  message: string;
}

/** 생성된 문제 정보 */
export interface GeneratedProblemInfo {
  title: string;
  content: string;
  latex: string | null;
}

/** AI 응답 메시지 상세 */
export interface AssistantMessageDetail {
  messageId: number;
  text: string;
  sections: SectionInfo[];
  codeExecution: CodeExecutionInfo | null;
  generatedProblem: GeneratedProblemInfo | null;
  createdAt: string;
}

/** AI 실행 정보 */
export interface AiRunInfo {
  aiRunId: number;
  runType: string;
  modelName: string;
  status: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

/** 크레딧 사용 내역 */
export interface CreditBreakdown {
  reason: string;
  amount: number;
}

/** 크레딧 사용 정보 */
export interface CreditUsedInfo {
  amount: number;
  breakdown: CreditBreakdown[];
}

/** 대화 상세 응답 */
export interface ConversationDetailResponse {
  conversationId: number;
  note: NoteInfo;
  userMessage: UserMessageDetail;
  assistantMessage: AssistantMessageDetail;
  aiRuns: AiRunInfo[];
  creditUsed: CreditUsedInfo;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 대화 검색 (GET /api/conversations/search)
// ============================================================

/** 대화 검색 파라미터 */
export interface ConversationSearchParams {
  /** 검색 키워드 (최소 2자) */
  query: string;
  /** 특정 노트 내에서만 검색 */
  noteId?: number;
  /** 사용된 도구로 필터링 (graph, solution, canvas, code_verify) */
  toolCode?: string;
  /** 검색 시작일 (ISO 8601, YYYY-MM-DD) */
  startDate?: string;
  /** 검색 종료일 (ISO 8601, YYYY-MM-DD) */
  endDate?: string;
  /** 페이지 번호 (0부터 시작) */
  page?: number;
  /** 페이지 크기 (최대 100) */
  size?: number;
}

/** 멘션된 파일 (검색 결과용) */
export interface MentionedFile {
  assetId: number;
  fileName: string;
}

/** 검색 결과 메시지 정보 (백엔드 MessageInfo 구조) */
export interface SearchMessageInfo {
  text: string;
  preview: string;
  highlight: string;
}

/** 대화 검색 결과 항목 */
export interface ConversationSearchItem {
  conversationId: number;
  noteId: number;
  noteTitle: string;
  userMessage: SearchMessageInfo | null;
  assistantMessage: SearchMessageInfo | null;
  mentionedFiles: MentionedFile[];
  mentionedTools: string[];
  relevance: number;
  createdAt: string;
}

/** 검색 메타데이터 */
export interface SearchMetadata {
  query: string;
  totalMatches: number;
  searchTimeMs: number;
}

/** 대화 검색 응답 */
export interface ConversationSearchResponse {
  conversations: ConversationSearchItem[];
  pageInfo: PageInfo;
  searchMetadata: SearchMetadata;
}

// ============================================================
// 캔버스 이미지 업로드 (POST /api/conversations/canvas-images)
// ============================================================

/** 캔버스 이미지 업로드 요청 */
export interface CanvasImageUploadRequest {
  noteId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

/** 캔버스 이미지 업로드 응답 */
export interface CanvasImageUploadResponse {
  assetId: number;
  source: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadUrl: string;
  createdAt: string;
}

// ============================================================
// SSE 스트리밍 이벤트 타입 (POST /stream/v2)
// ============================================================

export type SSEV2EventName =
  | "session.metadata"
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "node.started"
  | "node.progress"
  | "node.completed"
  | "llm.message.started"
  | "llm.token.delta"
  | "llm.message.completed"
  | "chat.message"
  | "tool.call.started"
  | "tool.call.completed"
  | "credit.updated"
  | "artifact.ready"
  | "heartbeat"
  | (string & {});

/** SSE v2 공통 envelope */
export interface SSEV2Envelope {
  v: string;
  ts: string;
  seq: number;
  run_id: string;
  thread_id: string;
}

/** SSE v2 frame */
export interface SSEEvent {
  id?: string;
  event: SSEV2EventName;
  data: SSEV2Envelope & Record<string, unknown>;
}

// ============================================================
// API 응답 타입 별칭
// ============================================================

export type ToolListResponse = ApiResponse<ToolListResult>;
