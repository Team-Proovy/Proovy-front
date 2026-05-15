import type { SSEEvent } from "../types/editor_types";

/**
 * SSE v2 스트림 파서
 * fetch Response에서 SSE v2 이벤트를 비동기 제너레이터로 파싱합니다.
 *
 * SSE v2 형식 (이벤트 블록은 빈 줄로 구분):
 *   id: {run_id}:{seq}
 *   event: {event_name}
 *   data: {JSON payload}
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
    const dataLines: string[] = [];

    for (const line of block.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("event:")) {
        eventType = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        dataLines.push(trimmed.slice(5).trim());
      }
      // id: 와 주석(:)은 무시
    }

    const dataStr = dataLines.join("\n");
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

      // SSE 이벤트 블록은 빈 줄(LF/CRLF 모두 허용)로 구분
      const blocks = buffer.split(/\r?\n\r?\n/);
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
