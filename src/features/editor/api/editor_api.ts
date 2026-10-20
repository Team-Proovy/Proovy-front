import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  ToolListParams,
  ToolListResponse,
  ConversationSearchParams,
  ConversationSearchResponse,
  CanvasImageUploadRequest,
  CanvasImageUploadResponse,
} from "../types/editor_types";

/**
 * 도구 목록 조회
 * GET /api/notes/tools
 */
export const getTools = async (
  params?: ToolListParams,
): Promise<ToolListResponse> => {
  const response = await apiClient.get<ToolListResponse>("/api/notes/tools", {
    params: { query: params?.query },
  });
  return response.data;
};

/**
 * 대화 검색
 * GET /api/conversations/search
 */
export const searchConversations = async (
  params: ConversationSearchParams,
): Promise<ApiResponse<ConversationSearchResponse>> => {
  const response = await apiClient.get<ApiResponse<ConversationSearchResponse>>(
    "/api/conversations/search",
    { params },
  );
  return response.data;
};

/**
 * 캔버스 이미지 업로드 (Presigned URL 발급)
 * POST /api/conversations/canvas-images
 */
export const uploadCanvasImage = async (
  request: CanvasImageUploadRequest,
): Promise<ApiResponse<CanvasImageUploadResponse>> => {
  const response = await apiClient.post<ApiResponse<CanvasImageUploadResponse>>(
    "/api/conversations/canvas-images",
    request,
  );
  return response.data;
};
