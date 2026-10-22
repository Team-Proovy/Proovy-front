import {
  BROWSER_FRAME_TYPES,
  BROWSER_RUN_LIMITS,
  isTerminalFrame,
  toEventId,
} from "@/shared/contracts/browser_run_v1";
import type {
  BrowserFrame,
  EventId,
  TerminalFrame,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import type { RunApiError } from "./run_api_error";
import { isUuid } from "./run_request";

/**
 * fetch 기반 browser-run SSE reader.
 *
 * POST SSE는 body와 `Authorization`이 필요해 `EventSource`를 쓰지 않는다. 한 번의 연결만 읽고,
 * 재접속·backoff는 호출한 쪽(1.93)이 `RunStreamEnd`를 보고 정한다.
 *
 * - 줄 끝은 CR·LF·CRLF 모두 허용하고 청크 경계에서 갈린 줄·CRLF도 이어 붙인다(WHATWG SSE).
 * - comment(`: heartbeat`)와 data 없는 블록은 frame·cursor가 아니다.
 * - 끝 빈 줄 없이 끊긴 마지막 블록은 잘린 것이라 버린다.
 * - watchdog: 마지막 수신(frame·heartbeat 등 아무 바이트) 뒤 `idleTimeoutMs` 동안 바이트가 없으면 연결이 죽은 것
 *   (FIN·RST 없이 끊긴 half-open, 중간 proxy가 upstream 단절을 전달하지 않음)으로 보고 끊는다.
 */

/**
 * 무수신 감시 시간 기본값: heartbeat(15초, browser-run-v1 D10) 3회분.
 * heartbeat 한두 번이 늦거나(서버 전송 중 heartbeat 생략·GC·망 지연) 하나를 놓쳐도 끊지 않고, 실제 단절은 1분 안에 재접속한다.
 */
export const RUN_STREAM_IDLE_TIMEOUT_MS =
  BROWSER_RUN_LIMITS.heartbeatSeconds * 1000 * 3;

// ---------------------------------------------------------------------------
// 종료 사유
// ---------------------------------------------------------------------------

/**
 * 한 연결이 끝난 사유. `lastEventId`는 다음 재접속에 쓸 cursor다 — 이 연결에서 마지막으로
 * 처리한 frame의 `id`, frame이 없으면 연결할 때 보낸 cursor(없으면 null). heartbeat는 cursor가 아니다.
 */
export type RunStreamEnd =
  /** terminal frame(`run.completed`|`run.failed`|`run.canceled`)을 받고 끝남 — 정상 종료 */
  | { reason: "terminal"; terminalFrame: TerminalFrame; lastEventId: EventId }
  /** terminal 없이 끝남 — 실행 취소가 아니다. 재접속 대상이다. */
  | {
      reason: "interrupted";
      /**
       * - `eof`: 서버가 terminal 없이 연결을 닫음(최대 유지 시간·재시작·내부 오류)
       * - `network`: 연결 실패·읽기 중 네트워크 오류
       * - `protocol`: frame이 계약 형식이 아님(JSON 오류·event/id와 data 불일치 등) — 연결을 끊었다
       * - `stalled`: `idleTimeoutMs` 동안 아무 바이트(heartbeat 포함)도 오지 않아 watchdog이 연결을 끊었다
       */
      cause: "eof" | "network" | "protocol" | "stalled";
      error?: unknown;
      lastEventId: EventId | null;
    }
  /** 호출한 쪽 `AbortSignal`로 끊음 */
  | { reason: "aborted"; lastEventId: EventId | null }
  /** stream 시작 전 JSON `ApiResponse` 오류(401·409 RUN4091·429 RUN4291 등). frame은 없다. */
  | { reason: "rejected"; error: RunApiError; lastEventId: EventId | null };

export interface RunStreamReadOptions {
  /** frame마다 순서대로 한 번 부른다. 던지면 연결을 끊고 그 오류를 그대로 던진다. */
  onFrame: (frame: BrowserFrame) => void;
  signal?: AbortSignal;
  /** 알면 넣는다(GET 재접속). 다른 run의 frame은 protocol 오류다. POST는 첫 frame의 runId로 고정한다. */
  runId?: Uuid;
  /** 연결 시 보낸 cursor. frame 없이 끝나면 `lastEventId`로 돌려준다. */
  lastEventId?: EventId | null;
  /** 무수신 감시 시간(ms, 양수 또는 null). 기본 `RUN_STREAM_IDLE_TIMEOUT_MS`, null이면 감시하지 않는다. */
  idleTimeoutMs?: number | null;
}

/** SSE 응답 body를 끝까지(또는 terminal까지) 읽는다. 네트워크 오류를 정상 종료로 삼키지 않는다. */
export const readRunStream = async (
  body: ReadableStream<Uint8Array>,
  {
    onFrame,
    signal,
    runId,
    lastEventId = null,
    idleTimeoutMs = RUN_STREAM_IDLE_TIMEOUT_MS,
  }: RunStreamReadOptions,
): Promise<RunStreamEnd> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let streamRunId = runId;
  let cursor = lastEventId;
  let pendingFrames: BrowserFrame[] = [];
  let protocolError: SseProtocolError | null = null;

  const parser = createSseParser((message) => {
    if (protocolError) return;
    try {
      const frame = toBrowserFrame(message, streamRunId);
      streamRunId = frame.runId;
      pendingFrames.push(frame);
    } catch (error) {
      protocolError = error as SseProtocolError;
    }
  });

  const cancelReader = () => {
    reader.cancel(signal?.reason).catch(() => {});
  };
  signal?.addEventListener("abort", cancelReader);

  // read 하나를 기다리는 동안만 감시한다(terminal·종료 뒤에는 finally가 푼다). cancel하면 대기 중 read가 끝난다.
  let stalled = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const watch = () => {
    clearTimeout(idleTimer);
    if (idleTimeoutMs == null) return;
    idleTimer = setTimeout(() => {
      stalled = true;
      reader.cancel(new Error("run stream idle timeout")).catch(() => {});
    }, idleTimeoutMs);
  };
  const stalledEnd = (): RunStreamEnd => ({
    reason: "interrupted",
    cause: "stalled",
    lastEventId: cursor,
  });

  try {
    if (signal?.aborted) return { reason: "aborted", lastEventId: cursor };
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      watch();
      try {
        chunk = await reader.read();
      } catch (error) {
        if (signal?.aborted) return { reason: "aborted", lastEventId: cursor };
        if (stalled) return stalledEnd();
        return {
          reason: "interrupted",
          cause: "network",
          error,
          lastEventId: cursor,
        };
      }

      // abort 뒤에는 이미 받은 바이트도 frame으로 내지 않는다.
      if (signal?.aborted) return { reason: "aborted", lastEventId: cursor };
      if (stalled) return stalledEnd();
      if (chunk.done) parser.feed(decoder.decode());
      else parser.feed(decoder.decode(chunk.value, { stream: true }));

      const frames = pendingFrames;
      pendingFrames = [];
      for (const frame of frames) {
        if (signal?.aborted) return { reason: "aborted", lastEventId: cursor };
        onFrame(frame);
        cursor = toEventId(frame.runId, frame.seq);
        if (isTerminalFrame(frame)) {
          // 서버는 terminal 직후 닫는다. 그 뒤 바이트는 읽지 않는다.
          return {
            reason: "terminal",
            terminalFrame: frame,
            lastEventId: cursor,
          };
        }
      }

      if (protocolError)
        return {
          reason: "interrupted",
          cause: "protocol",
          error: protocolError,
          lastEventId: cursor,
        };
      if (chunk.done)
        return { reason: "interrupted", cause: "eof", lastEventId: cursor };
    }
  } finally {
    clearTimeout(idleTimer);
    signal?.removeEventListener("abort", cancelReader);
    cancelReader();
    reader.releaseLock();
  }
};

// ---------------------------------------------------------------------------
// frame 변환
// ---------------------------------------------------------------------------

export class SseProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SseProtocolError";
  }
}

const FRAME_TYPES: readonly string[] = BROWSER_FRAME_TYPES;

/**
 * SSE 메시지 하나를 durable frame으로 바꾼다. `event`=`data.type`, `id`=`{runId}:{seq}`인지만 본다.
 * payload 검사·seq 순서(S1~S7)는 상태 판단 쪽 몫이다.
 */
export const toBrowserFrame = (
  message: SseMessage,
  expectedRunId?: Uuid,
): BrowserFrame => {
  let data: unknown;
  try {
    data = JSON.parse(message.data);
  } catch {
    throw new SseProtocolError(`data가 JSON이 아니다 (event ${message.event})`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data))
    throw new SseProtocolError("data가 객체가 아니다");
  const { type, runId, seq } = data as Record<string, unknown>;
  if (typeof type !== "string" || !FRAME_TYPES.includes(type))
    throw new SseProtocolError(`알 수 없는 frame type: ${String(type)}`);
  if (message.event !== type)
    throw new SseProtocolError(
      `event(${message.event})와 type(${type})이 다르다`,
    );
  // cursor를 만드는 필드는 reader가 보장한다(다음 재접속 cursor가 계약 형식이어야 한다).
  if (!isUuid(runId))
    throw new SseProtocolError(
      `runId가 소문자 UUID가 아니다: ${String(runId)}`,
    );
  if (typeof seq !== "number" || !Number.isSafeInteger(seq) || seq < 1)
    throw new SseProtocolError(`seq가 1..2^53-1 정수가 아니다: ${String(seq)}`);
  if (message.id !== toEventId(runId, seq))
    throw new SseProtocolError(`id(${message.id})가 ${runId}:${seq}가 아니다`);
  if (expectedRunId !== undefined && runId !== expectedRunId)
    throw new SseProtocolError(`다른 run의 frame: ${runId}`);
  return data as BrowserFrame;
};

// ---------------------------------------------------------------------------
// SSE 파서
// ---------------------------------------------------------------------------

/** 빈 줄로 끝난, data가 있는 SSE 블록 하나 */
export interface SseMessage {
  /** `event` 필드. 없으면 `message` */
  event: string;
  /** 이 블록의 `id` 필드. 없으면 null (앞 블록 id를 물려받지 않는다) */
  id: string | null;
  /** data 줄을 `\n`으로 이은 값 */
  data: string;
}

/**
 * 디코드된 텍스트를 조각 단위로 받아 SSE 메시지를 낸다. 청크 경계는 어디든 될 수 있다.
 * `id`는 블록 단위로만 쓴다 — data 없는 블록(heartbeat에 id가 붙은 위반 등)의 id는 cursor가 되지 않는다.
 */
export const createSseParser = (onMessage: (message: SseMessage) => void) => {
  let lineBuffer = "";
  let isAfterCr = false;
  let eventName = "";
  let eventId: string | null = null;
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length > 0)
      onMessage({
        event: eventName || "message",
        id: eventId,
        data: dataLines.join("\n"),
      });
    eventName = "";
    eventId = null;
    dataLines = [];
  };

  const processLine = (line: string) => {
    if (line === "") {
      dispatch();
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") eventName = value;
    else if (field === "data") dataLines.push(value);
    else if (field === "id" && !value.includes("\0")) eventId = value;
    // retry·알 수 없는 필드는 무시한다.
  };

  const feed = (text: string) => {
    if (text === "") return;
    let start = 0;
    // 앞 조각이 CR로 끝났으면 이 조각 첫 LF는 같은 CRLF다.
    if (isAfterCr && text.startsWith("\n")) start = 1;
    isAfterCr = false;
    for (let index = start; index < text.length; index++) {
      const char = text[index];
      if (char !== "\r" && char !== "\n") continue;
      processLine(lineBuffer + text.slice(start, index));
      lineBuffer = "";
      if (char === "\r") {
        if (index + 1 === text.length) isAfterCr = true;
        else if (text[index + 1] === "\n") index++;
      }
      start = index + 1;
    }
    lineBuffer += text.slice(start);
  };

  return { feed };
};
