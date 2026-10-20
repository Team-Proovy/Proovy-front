import type { PageInfo } from "@/shared/api/shared_types";

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
