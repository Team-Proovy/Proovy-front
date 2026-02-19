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
  SSEEvent,
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
  const streamTokens = params?.streamTokens ?? true;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const streamV2Path = import.meta.env.VITE_SSE_V2_ENDPOINT ?? "/stream/v2";
  const normalizedStreamV2Path = streamV2Path.startsWith("/")
    ? streamV2Path
    : `/${streamV2Path}`;
  const token = tokenUtils.getAccessToken();

  const requestUrl = isStream
    ? `${baseUrl}${normalizedStreamV2Path}`
    : `${baseUrl}/api/conversations?isStream=${isStream}`;

  const streamRequestBody = isStream
    ? {
        ...request,
        message: request.text,
        streamTokens,
      }
    : request;

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(streamRequestBody),
    signal: params?.signal,
  });

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

/**
 * SSE 스트림 파서
 * fetch Response에서 SSE 이벤트를 비동기 제너레이터로 파싱합니다.
 *
 * 지원 형식(v2):
 * id: <run_id>:<seq>
 * event: <event_name>
 * data: <json>
 */
export const parseSSEStream = async function* (
  response: Response,
): AsyncGenerator<SSEEvent> {
  if (!response.body) {
    throw new Error("스트리밍 응답 본문이 없습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let frameId: string | undefined;
  let frameEvent: string | undefined;
  let frameDataLines: string[] = [];

  const flushFrame = (): SSEEvent | null => {
    if (!frameEvent && frameDataLines.length === 0) {
      return null;
    }

    const rawId = frameId;
    const rawEvent = frameEvent;
    const rawData = frameDataLines.join("\n").trim();

    frameId = undefined;
    frameEvent = undefined;
    frameDataLines = [];

    if (!rawData) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawData) as SSEEvent["data"];

      return {
        id: rawId,
        event: rawEvent ?? "message",
        data: parsed,
      };
    } catch {
      return null;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line) {
          const event = flushFrame();
          if (event) {
            yield event;
          }
          continue;
        }

        if (line.startsWith(":")) {
          continue;
        }

        if (line.startsWith("id:")) {
          frameId = line.slice(3).trim();
          continue;
        }

        if (line.startsWith("event:")) {
          frameEvent = line.slice(6).trim();
          continue;
        }

        if (line.startsWith("data:")) {
          frameDataLines.push(line.slice(5).trim());
        }
      }
    }

    buffer += decoder.decode();
    const trailing = buffer.trim();
    if (trailing) {
      const trailingLines = trailing.split(/\r?\n/);
      for (const line of trailingLines) {
        if (line.startsWith("id:")) {
          frameId = line.slice(3).trim();
          continue;
        }
        if (line.startsWith("event:")) {
          frameEvent = line.slice(6).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          frameDataLines.push(line.slice(5).trim());
        }
      }
    }

    const lastEvent = flushFrame();
    if (lastEvent) {
      yield lastEvent;
    }
  } finally {
    reader.releaseLock();
  }
};
