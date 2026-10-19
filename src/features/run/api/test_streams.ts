/**
 * run api 테스트용 ReadableStream·Response helper (테스트 전용).
 */

const encoder = new TextEncoder();

export const encodeSse = (text: string) => encoder.encode(text);

/** 바이트를 `size`씩 자른다. */
export const splitBytes = (bytes: Uint8Array, size: number) => {
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytes.length; offset += size)
    chunks.push(bytes.slice(offset, offset + size));
  return chunks;
};

/** 고정 seed로 1..maxSize 바이트씩 자른다(재현 가능한 임의 분할). */
export const splitBytesRandomly = (
  bytes: Uint8Array,
  seed: number,
  maxSize = 64,
) => {
  let state = seed;
  const nextSize = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return 1 + (state % maxSize);
  };
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytes.length; ) {
    const size = nextSize();
    chunks.push(bytes.slice(offset, offset + size));
    offset += size;
  }
  return chunks;
};

export interface TestStreamOptions {
  /** 모든 chunk 뒤 끝내는 방식: 정상 close(기본)·네트워크 오류·열어 둠(abort 테스트) */
  end?: "close" | "error" | "open";
}

export interface TestStream {
  stream: ReadableStream<Uint8Array>;
  /** reader가 cancel했는지 */
  isCanceled: () => boolean;
}

export const createTestStream = (
  chunks: (Uint8Array | string)[],
  { end = "close" }: TestStreamOptions = {},
): TestStream => {
  let index = 0;
  let isCanceled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        const chunk = chunks[index++];
        controller.enqueue(
          typeof chunk === "string" ? encodeSse(chunk) : chunk,
        );
        return;
      }
      if (end === "close") controller.close();
      else if (end === "error")
        controller.error(new TypeError("network error"));
      else return new Promise<void>(() => {}); // 다음 바이트가 오지 않는 열린 연결
    },
    cancel() {
      isCanceled = true;
    },
  });
  return { stream, isCanceled: () => isCanceled };
};

export const sseResponse = (
  chunks: (Uint8Array | string)[],
  options?: TestStreamOptions,
) =>
  new Response(createTestStream(chunks, options).stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream;charset=UTF-8" },
  });

export const jsonResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
