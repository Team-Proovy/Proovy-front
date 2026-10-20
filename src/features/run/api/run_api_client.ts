import { refreshAccessToken, tokenUtils } from "@/shared/api/client";
import type {
  ApiSuccessResponse,
  BrowserFrame,
  ConversationPage,
  ConversationRunRequest,
  EventId,
  NoteId,
  RunCancelResult,
  RunStatus,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import { readRunApiError, RunApiError } from "./run_api_error";
import { isUuid, validateConversationRequest } from "./run_request";
import { readRunStream } from "./sse_reader";
import type { RunStreamEnd } from "./sse_reader";

/**
 * browser-run-v1 run API client (S07 Server 경로).
 *
 * - SSE 함수(`streamConversation`·`streamRunEvents`)는 한 번의 연결 결과를 `RunStreamEnd`로 돌려준다.
 *   reject하는 경우는 계약에 맞지 않는 입력(request·runId·cursor → `TypeError`)과 `onFrame` 예외뿐이다.
 * - JSON 함수는 성공 시 `result`를 돌려주고, 오류 응답은 `RunApiError`로 던진다.
 *   fetch 자체 실패(네트워크·abort)는 fetch의 오류(`TypeError`·`AbortError`)를 그대로 던진다.
 * - 모든 요청은 `Authorization: Bearer`를 붙이고, stream 전 401이면 token을 한 번 갱신해 같은 요청을 다시 보낸다.
 */

export interface RunApiAuth {
  getAccessToken: () => string | null;
  /** 새 access token. 없으면 401을 그대로 돌려준다. */
  refreshAccessToken?: () => Promise<string>;
}

export interface RunApiClientOptions {
  /** 기본 `VITE_API_BASE_URL` (개발은 빈 값 → vite proxy) */
  baseUrl?: string;
  fetch?: typeof fetch;
  auth?: RunApiAuth;
}

export interface RunStreamOptions {
  /** frame마다 순서대로 한 번 부른다. */
  onFrame: (frame: BrowserFrame) => void;
  /** 200 SSE 응답을 받은 직후(첫 frame 전) 부른다. */
  onOpen?: () => void;
  signal?: AbortSignal;
}

export interface RunEventsCursor {
  /** 마지막으로 처리한 frame의 `id`(`{runId}:{seq}`). 없으면 seq 1부터 받는다. */
  lastEventId?: EventId | null;
  /** cursor를 실을 곳. 기본 `header`(`Last-Event-ID`). header를 못 쓰는 환경이면 `query`(`?lastEventId=`). */
  placement?: "header" | "query";
}

export interface ConversationMessagesQuery {
  /** 이 messageId보다 이전 메시지 (이전 페이지의 `nextBefore`) */
  before?: Uuid | null;
  /** 1..100, 기본 50(Server) */
  limit?: number;
}

// schema `EventId` 패턴: 소문자 UUID + `:` + 선행 0 없는 seq. 상한(2^53-1)은 숫자로 따로 본다.
const EVENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[1-9][0-9]{0,15}(?![\s\S])/;

export const isEventId = (value: unknown): value is EventId =>
  typeof value === "string" &&
  EVENT_ID_PATTERN.test(value) &&
  Number(value.slice(value.indexOf(":") + 1)) <= Number.MAX_SAFE_INTEGER;

const parseJsonOrNull = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** `promise`를 기다리되 `signal`이 abort되면 그 reason으로 바로 reject한다. */
const raceAbort = <T>(promise: Promise<T>, signal?: AbortSignal | null) => {
  if (!signal) return promise;
  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
  promise.catch(() => {}); // abort로 진 뒤의 갱신 실패는 처리하지 않는다.
  return Promise.race([promise, aborted]).finally(() =>
    signal.removeEventListener("abort", onAbort),
  );
};

const SSE_ACCEPT = "text/event-stream";
const JSON_ACCEPT = "application/json";

export const createRunApiClient = ({
  baseUrl = import.meta.env.VITE_API_BASE_URL || "",
  fetch: fetchImpl = (...args) => globalThis.fetch(...args),
  auth = {
    getAccessToken: tokenUtils.getAccessToken,
    refreshAccessToken,
  },
}: RunApiClientOptions = {}) => {
  const send = async (path: string, init: RequestInit) => {
    const sendWith = (token: string | null) => {
      const headers = new Headers(init.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetchImpl(`${baseUrl}${path}`, { ...init, headers });
    };

    const response = await sendWith(auth.getAccessToken());
    if (response.status !== 401 || !auth.refreshAccessToken) return response;

    let token: string;
    try {
      token = await raceAbort(auth.refreshAccessToken(), init.signal);
    } catch (error) {
      // abort는 fetch 실패처럼 던지고, 갱신 실패는 처음 401을 돌려준다(redirect는 화면이 정한다).
      if (init.signal?.aborted) throw error;
      return response;
    }
    await response.body?.cancel().catch(() => {});
    return sendWith(token);
  };

  const openStream = async (
    path: string,
    init: RequestInit,
    { onFrame, onOpen, signal }: RunStreamOptions,
    runId?: Uuid,
    lastEventId: EventId | null = null,
  ): Promise<RunStreamEnd> => {
    const failConnection = (error: unknown): RunStreamEnd =>
      signal?.aborted
        ? { reason: "aborted", lastEventId }
        : { reason: "interrupted", cause: "network", error, lastEventId };

    let response: Response;
    try {
      response = await send(path, { ...init, signal });
    } catch (error) {
      return failConnection(error);
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    // 200인데 SSE가 아니면 계약 밖 응답이다(proxy 오류 페이지 등).
    if (!response.ok || !contentType.startsWith(SSE_ACCEPT) || !response.body) {
      try {
        const error = await readRunApiError(response);
        // 오류 body를 다 읽은 뒤 abort됐어도 호출한 쪽에는 abort가 먼저다.
        if (signal?.aborted) return { reason: "aborted", lastEventId };
        return { reason: "rejected", error, lastEventId };
      } catch (error) {
        // 오류 body를 읽다가 끊긴 경우: 거부가 아니라 연결 실패다.
        return failConnection(error);
      }
    }

    onOpen?.();
    return readRunStream(response.body, {
      onFrame,
      signal,
      runId,
      lastEventId,
    });
  };

  const requestJson = async <T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> => {
    const headers = new Headers(init.headers);
    headers.set("Accept", JSON_ACCEPT);
    const response = await send(path, { ...init, headers });
    if (!response.ok) throw await readRunApiError(response);
    // body 읽기 중 abort·네트워크 실패는 그대로 던지고, JSON이 아닌 본문만 계약 밖으로 본다.
    const body = parseJsonOrNull(
      await response.text(),
    ) as ApiSuccessResponse<T> | null;
    if (body?.isSuccess !== true)
      throw new RunApiError({
        code: null,
        status: response.status,
        rawCode: typeof body?.code === "string" ? body.code : null,
        message: typeof body?.message === "string" ? body.message : null,
      });
    return body.result;
  };

  /**
   * `POST /api/conversations` — 질문을 보내고 SSE를 seq 1(`run.created`)부터 읽는다.
   * 같은 전송을 다시 보낼 때는 같은 `request`(같은 requestId)를 넘긴다 — Server가 기존 run을 replay한다.
   * 계약에 맞지 않는 request는 보내지 않고 `TypeError`로 reject한다(`createConversationRequest`로 만든다).
   */
  const streamConversation = async (
    request: ConversationRunRequest,
    options: RunStreamOptions,
  ): Promise<RunStreamEnd> => {
    const check = validateConversationRequest(request);
    if (!check.ok)
      throw new TypeError(
        `계약에 맞지 않는 요청(${check.code}): ${check.issues
          .map((issue) => `${issue.path} ${issue.reason}`)
          .join(", ")}`,
      );
    return openStream(
      "/api/conversations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: SSE_ACCEPT },
        body: JSON.stringify(request),
      },
      options,
    );
  };

  /**
   * `GET /api/ai-runs/{runId}/events` — cursor 다음 seq부터 replay 후 terminal이 아니면 live로 이어 받는다.
   * runId는 소문자 canonical UUID, cursor는 같은 run의 frame `id`여야 한다(아니면 `TypeError`로 reject).
   * 형식 판정의 최종 기준은 Server(RUN4003·RUN4004)다.
   */
  const streamRunEvents = async (
    runId: Uuid,
    { lastEventId = null, placement = "header" }: RunEventsCursor,
    options: RunStreamOptions,
  ): Promise<RunStreamEnd> => {
    // frame runId는 정확히 같은 문자열로 비교하므로 대문자 runId는 모든 frame을 protocol 오류로 만든다.
    if (!isUuid(runId))
      throw new TypeError(`runId가 소문자 canonical UUID가 아니다: ${runId}`);
    if (
      lastEventId != null &&
      (!isEventId(lastEventId) || !lastEventId.startsWith(`${runId}:`))
    )
      throw new TypeError(`이 run의 event id가 아니다: ${lastEventId}`);
    const headers: Record<string, string> = { Accept: SSE_ACCEPT };
    let query = "";
    if (lastEventId != null && placement === "header")
      headers["Last-Event-ID"] = lastEventId;
    if (lastEventId != null && placement === "query")
      query = `?${new URLSearchParams({ lastEventId })}`;
    return openStream(
      `/api/ai-runs/${encodeURIComponent(runId)}/events${query}`,
      { method: "GET", headers },
      options,
      runId,
      lastEventId,
    );
  };

  /** `GET /api/ai-runs/{runId}` — 공개 상태와 그 시점 `lastSeq` */
  const getRunStatus = (runId: Uuid, signal?: AbortSignal) =>
    requestJson<RunStatus>(`/api/ai-runs/${encodeURIComponent(runId)}`, {
      signal,
    });

  /** `POST /api/ai-runs/{runId}/cancel` — body 없음(`{}`도 RUN4001). 멱등이다. */
  const cancelRun = (runId: Uuid, signal?: AbortSignal) =>
    requestJson<RunCancelResult>(
      `/api/ai-runs/${encodeURIComponent(runId)}/cancel`,
      { method: "POST", signal },
    );

  /** `GET /api/conversations/{noteId}/messages?before&limit` — createdAt 오름차순 한 페이지와 `activeRun` */
  const getConversationMessages = (
    noteId: NoteId,
    { before, limit }: ConversationMessagesQuery = {},
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams();
    if (before != null) params.set("before", before);
    if (limit != null) params.set("limit", String(limit));
    const query = params.toString() && `?${params}`;
    return requestJson<ConversationPage>(
      `/api/conversations/${encodeURIComponent(noteId)}/messages${query}`,
      { signal },
    );
  };

  return {
    streamConversation,
    streamRunEvents,
    getRunStatus,
    cancelRun,
    getConversationMessages,
  };
};

export type RunApiClient = ReturnType<typeof createRunApiClient>;

/** 앱 기본 client (`tokenUtils`·`refreshAccessToken` 사용) */
export const runApi = createRunApiClient();
