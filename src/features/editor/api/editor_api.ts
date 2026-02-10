import apiClient, { tokenUtils } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  ToolListParams,
  ToolListResponse,
  CreateConversationRequest,
  CreateConversationParams,
  ConversationResponseDto,
  ConversationDetailResponse,
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
 * 대화 생성 (SSE 스트리밍)
 * POST /api/conversations
 */
export const createConversation = async (
  request: CreateConversationRequest,
  params?: CreateConversationParams,
): Promise<Response> => {
  const isStream = params?.isStream ?? true;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = tokenUtils.getAccessToken();

  const response = await fetch(
    `${baseUrl}/api/conversations?isStream=${isStream}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(`대화 생성 실패: ${response.status}`);
  }

  return response;
};

/**
 * 대화 생성 (비-스트리밍, JSON 응답)
 * POST /api/conversations?isStream=false
 */
export const createConversationJson = async (
  request: CreateConversationRequest,
): Promise<ApiResponse<ConversationResponseDto>> => {
  const response = await apiClient.post<ApiResponse<ConversationResponseDto>>(
    "/api/conversations",
    request,
    {
      params: { isStream: false },
    },
  );
  return response.data;
};

/**
 * 대화 상세 조회
 * GET /api/conversations/{conversationId}
 */
export const getConversationDetail = async (
  conversationId: number,
): Promise<ApiResponse<ConversationDetailResponse>> => {
  const response = await apiClient.get<ApiResponse<ConversationDetailResponse>>(
    `/api/conversations/${conversationId}`,
  );
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
