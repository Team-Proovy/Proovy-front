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
      signal: params?.signal,
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

/**
 * SSE v2 스트림 파서
 * fetch Response에서 SSE v2 이벤트를 비동기 제너레이터로 파싱합니다.
 *
 * SSE v2 형식 (이벤트 블록은 빈 줄로 구분):
 *   id: {run_id}:{seq}
 *   event: {event_name}
 *   data: {JSON payload}
 *
 * 주요 이벤트:
 *   node.progress       → ThinkingBar 진행 상황 (data.message)
 *   llm.token.delta     → LLM 실시간 토큰 (data.delta, data.node)
 *   chat.message        → 완성된 메시지 (data.kind, data.content)
 *   run.completed       → 스트리밍 완료
 *   run.failed          → 스트리밍 오류
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

  function* parseBlock(block: string): Generator<SSEEvent> {
    if (!block.trim()) return;

    let eventType = "";
    let dataStr = "";

    for (const line of block.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event:")) {
        eventType = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        dataStr = trimmed.slice(5).trim();
      }
      // id: 와 주석(:)은 무시
    }

    if (!dataStr || !eventType) return;

    try {
      const data = JSON.parse(dataStr);
      yield { event: eventType, ...data } as SSEEvent;
    } catch {
      // 파싱 불가 이벤트 무시
    }
  }

  try {
    while (true) {
      let done: boolean;
      let value: Uint8Array | undefined;
      try {
        ({ done, value } = await reader.read());
      } catch {
        // 서버가 run.completed 후 연결을 닫을 때 발생하는 네트워크 에러 → 정상 종료로 처리
        break;
      }
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 이벤트 블록은 빈 줄(\n\n)로 구분
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        yield* parseBlock(block);
      }
    }

    // 잔여 버퍼 flush
    buffer += decoder.decode();
    yield* parseBlock(buffer);
  } finally {
    reader.releaseLock();
  }
};
