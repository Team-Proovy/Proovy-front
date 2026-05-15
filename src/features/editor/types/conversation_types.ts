import type { PageInfo } from "@/shared/api/shared_types";

export interface CreateConversationRequest {
  noteId?: number;
  text: string;
  latex?: string;
  mentionedAssetIds?: number[];
  chosenFeatures?: string[];
  canvasImageIds?: number[];
}

export interface CreateConversationParams {
  isStream?: boolean;
  signal?: AbortSignal;
}

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

export interface NoteInfo {
  noteId: number;
  title: string;
}

export interface MentionedFileDetail {
  assetId: number;
  fileName: string;
  thumbnailUrl: string | null;
}

export interface CanvasImageInfo {
  assetId: number;
  previewUrl: string;
}

export interface UserMessageDetail {
  messageId: number;
  text: string;
  latex: string | null;
  mentionedFiles: MentionedFileDetail[];
  mentionedTools: string[];
  canvasImages: CanvasImageInfo[];
  createdAt: string;
}

export interface SectionInfo {
  type: string;
  title: string;
  content: string;
}

export interface CodeExecutionInfo {
  status: string;
  message: string;
}

export interface GeneratedProblemInfo {
  title: string;
  content: string;
  latex: string | null;
}

export interface AssistantMessageDetail {
  messageId: number;
  text: string;
  sections: SectionInfo[];
  codeExecution: CodeExecutionInfo | null;
  generatedProblem: GeneratedProblemInfo | null;
  createdAt: string;
}

export interface AiRunInfo {
  aiRunId: number;
  runType: string;
  modelName: string;
  status: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export interface CreditBreakdown {
  reason: string;
  amount: number;
}

export interface CreditUsedInfo {
  amount: number;
  breakdown: CreditBreakdown[];
}

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

export interface ConversationSearchParams {
  query: string;
  noteId?: number;
  toolCode?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface MentionedFile {
  assetId: number;
  fileName: string;
}

export interface SearchMessageInfo {
  text: string;
  preview: string;
  highlight: string;
}

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

export interface SearchMetadata {
  query: string;
  totalMatches: number;
  searchTimeMs: number;
}

export interface ConversationSearchResponse {
  conversations: ConversationSearchItem[];
  pageInfo: PageInfo;
  searchMetadata: SearchMetadata;
}
