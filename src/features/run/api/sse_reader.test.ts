// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  HEARTBEAT_COMMENT,
  toEventId,
} from "@/shared/contracts/browser_run_v1";
import type { BrowserFrame } from "@/shared/contracts/browser_run_v1";
import {
  getHeartbeatFixture,
  getStreamFixture,
  listStreamFixtures,
} from "@/test/contracts/browser_run_fixtures";
import {
  createSseParser,
  readRunStream,
  RUN_STREAM_IDLE_TIMEOUT_MS,
  SseProtocolError,
} from "./sse_reader";
import type { RunStreamReadOptions, SseMessage } from "./sse_reader";
import {
  createTestStream,
  encodeSse,
  splitBytes,
  splitBytesRandomly,
} from "./test_streams";
import type { TestStreamOptions } from "./test_streams";

const readAll = async (
  chunks: (Uint8Array | string)[],
  streamOptions?: TestStreamOptions,
  readOptions: Omit<RunStreamReadOptions, "onFrame"> = {},
) => {
  const frames: BrowserFrame[] = [];
  const testStream = createTestStream(chunks, streamOptions);
  const end = await readRunStream(testStream.stream, {
    ...readOptions,
    onFrame: (frame) => frames.push(frame),
  });
  return { frames, end, isCanceled: testStream.isCanceled };
};

const lastIdOf = (frames: BrowserFrame[]) => {
  const last = frames[frames.length - 1];
  return toEventId(last.runId, last.seq);
};

/** fixture SSE를 frame 블록 단위로 나눈다(각 블록은 빈 줄로 끝난다). */
const splitBlocks = (sse: string) =>
  sse
    .split("\n\n")
    .filter(Boolean)
    .map((block) => `${block}\n\n`);

const streamFixtures = listStreamFixtures();

describe("readRunStream — fixture streams/valid", () => {
  it("fixture는 10개다", () => {
    expect(streamFixtures).toHaveLength(10);
  });

  it.each(streamFixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s: SSE 바이트 → 같은 frame 목록, terminal 정상 종료",
    async (_name, fixture) => {
      const { frames, end } = await readAll([encodeSse(fixture.sse)]);

      expect(frames).toEqual(fixture.frames);
      expect(end).toEqual({
        reason: "terminal",
        terminalFrame: fixture.frames[fixture.frames.length - 1],
        lastEventId: lastIdOf(fixture.frames),
      });
    },
  );

  it.each(streamFixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s: 1바이트·임의 청크 분할에도 같은 frame 목록",
    async (_name, fixture) => {
      const bytes = encodeSse(fixture.sse);
      for (const chunks of [
        splitBytes(bytes, 1),
        splitBytesRandomly(bytes, 7),
        splitBytesRandomly(bytes, 2026, 5),
      ]) {
        const { frames, end } = await readAll(chunks);
        expect(frames).toEqual(fixture.frames);
        expect(end.reason).toBe("terminal");
      }
    },
  );

  it("모든 위치에서 두 조각으로 나눠도 같다 (UTF-8 다바이트 문자·CRLF 경계 포함)", async () => {
    const fixture = getStreamFixture("canceled-pending");
    const variants = [fixture.sse, fixture.sse.replaceAll("\n", "\r\n")];
    for (const sse of variants) {
      const bytes = encodeSse(sse);
      for (let cut = 1; cut < bytes.length; cut++) {
        const { frames } = await readAll([
          bytes.slice(0, cut),
          bytes.slice(cut),
        ]);
        expect(frames, `cut ${cut}`).toEqual(fixture.frames);
      }
    }
  });

  it.each([
    ["CRLF", "\r\n"],
    ["CR", "\r"],
  ])("줄 끝 %s도 LF와 같은 frame", async (_name, newline) => {
    const fixture = getStreamFixture("substantive-completed");
    const sse = fixture.sse.replaceAll("\n", newline);
    for (const chunks of [[encodeSse(sse)], splitBytes(encodeSse(sse), 1)]) {
      const { frames, end } = await readAll(chunks);
      expect(frames).toEqual(fixture.frames);
      expect(end.reason).toBe("terminal");
    }
  });
});

describe("readRunStream — heartbeat", () => {
  const fixture = getStreamFixture("substantive-completed");
  const { comment, invalidCases } = getHeartbeatFixture();

  it("heartbeat 원문은 계약 사본과 같다", () => {
    expect(comment).toBe(HEARTBEAT_COMMENT);
  });

  it("frame 사이·앞의 heartbeat comment는 frame·cursor가 아니다", async () => {
    const blocks = splitBlocks(fixture.sse);
    const withHeartbeats = [
      comment,
      ...blocks.flatMap((block) => [block, comment, comment]),
    ].join("");
    const { frames, end } = await readAll(
      splitBytesRandomly(encodeSse(withHeartbeats), 11),
    );
    expect(frames).toEqual(fixture.frames);
    expect(end).toMatchObject({
      reason: "terminal",
      lastEventId: lastIdOf(fixture.frames),
    });
  });

  it("heartbeat만 오다 끊기면 cursor는 연결 때 보낸 값 그대로다", async () => {
    const cursor = toEventId(fixture.runId, 3);
    const { frames, end } = await readAll(
      [comment, comment],
      {},
      { lastEventId: cursor, runId: fixture.runId },
    );
    expect(frames).toEqual([]);
    expect(end).toEqual({
      reason: "interrupted",
      cause: "eof",
      lastEventId: cursor,
    });
  });

  it("heartbeat-with-id: data 없는 블록의 id는 cursor를 바꾸지 않는다", async () => {
    const heartbeatWithId = invalidCases.find(
      (testCase) => testCase.name === "heartbeat-with-id",
    )!;
    const [first, second] = splitBlocks(fixture.sse);
    const { frames, end } = await readAll([first, heartbeatWithId.sse, second]);
    expect(frames).toEqual(fixture.frames.slice(0, 2));
    expect(end).toMatchObject({
      reason: "interrupted",
      cause: "eof",
      lastEventId: lastIdOf(fixture.frames.slice(0, 2)),
    });
  });

  it.each(["heartbeat-with-data", "heartbeat-as-event"])(
    "%s: frame이 아닌 data 블록은 protocol 오류로 연결을 끝낸다",
    async (name) => {
      const invalid = invalidCases.find((testCase) => testCase.name === name)!;
      const [first, ...rest] = splitBlocks(fixture.sse);
      const { frames, end, isCanceled } = await readAll([
        first,
        invalid.sse,
        ...rest,
      ]);
      expect(frames).toEqual(fixture.frames.slice(0, 1));
      expect(end).toMatchObject({
        reason: "interrupted",
        cause: "protocol",
        lastEventId: lastIdOf(fixture.frames.slice(0, 1)),
      });
      if (end.reason === "interrupted")
        expect(end.error).toBeInstanceOf(SseProtocolError);
      expect(isCanceled()).toBe(true);
    },
  );
});

describe("readRunStream — 종료 사유", () => {
  const fixture = getStreamFixture("canceled-running");
  const blocks = splitBlocks(fixture.sse);
  const nonTerminalBlocks = blocks.slice(0, -1);
  const nonTerminalFrames = fixture.frames.slice(0, -1);

  it("terminal 없이 서버가 닫으면 interrupted(eof)와 마지막 frame cursor", async () => {
    const { frames, end } = await readAll(nonTerminalBlocks);
    expect(frames).toEqual(nonTerminalFrames);
    expect(end).toEqual({
      reason: "interrupted",
      cause: "eof",
      lastEventId: lastIdOf(nonTerminalFrames),
    });
  });

  it("빈 줄 없이 잘린 마지막 블록은 frame으로 내지 않는다", async () => {
    const terminalBlock = blocks[blocks.length - 1];
    for (const cut of [1, terminalBlock.length - 2, terminalBlock.length - 1]) {
      const { frames, end } = await readAll([
        ...nonTerminalBlocks,
        terminalBlock.slice(0, cut),
      ]);
      expect(frames).toEqual(nonTerminalFrames);
      expect(end).toMatchObject({ reason: "interrupted", cause: "eof" });
    }
  });

  it("읽는 중 네트워크 오류는 정상 종료가 아니라 interrupted(network)", async () => {
    const { frames, end } = await readAll(nonTerminalBlocks, { end: "error" });
    expect(frames).toEqual(nonTerminalFrames);
    expect(end).toMatchObject({
      reason: "interrupted",
      cause: "network",
      lastEventId: lastIdOf(nonTerminalFrames),
    });
    if (end.reason === "interrupted")
      expect(end.error).toBeInstanceOf(TypeError);
  });

  it("terminal 뒤 네트워크 오류가 와도 terminal 정상 종료다", async () => {
    const { end } = await readAll(blocks, { end: "error" });
    expect(end.reason).toBe("terminal");
  });

  it("사용자 abort는 aborted이고 abort 뒤 frame을 내지 않는다", async () => {
    const controller = new AbortController();
    const frames: BrowserFrame[] = [];
    const testStream = createTestStream(nonTerminalBlocks, { end: "open" });
    const endPromise = readRunStream(testStream.stream, {
      signal: controller.signal,
      onFrame: (frame) => {
        frames.push(frame);
        if (frame.seq === 2) controller.abort();
      },
    });
    const end = await endPromise;
    expect(frames.map((frame) => frame.seq)).toEqual([1, 2]);
    expect(end).toEqual({
      reason: "aborted",
      lastEventId: lastIdOf(nonTerminalFrames.slice(0, 2)),
    });
    expect(testStream.isCanceled()).toBe(true);
  });

  it("열린 연결을 기다리는 중 abort해도 aborted", async () => {
    const controller = new AbortController();
    const testStream = createTestStream(nonTerminalBlocks, { end: "open" });
    const onFrame = vi.fn();
    const endPromise = readRunStream(testStream.stream, {
      signal: controller.signal,
      onFrame,
    });
    await vi.waitFor(() =>
      expect(onFrame).toHaveBeenCalledTimes(nonTerminalFrames.length),
    );
    controller.abort();
    expect(await endPromise).toEqual({
      reason: "aborted",
      lastEventId: lastIdOf(nonTerminalFrames),
    });
    expect(testStream.isCanceled()).toBe(true);
  });

  it("이미 abort된 signal이면 읽지 않고 aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const { frames, end } = await readAll(
      blocks,
      {},
      {
        signal: controller.signal,
      },
    );
    expect(frames).toEqual([]);
    expect(end).toEqual({ reason: "aborted", lastEventId: null });
  });

  it("terminal 뒤 바이트는 읽지 않고 연결을 닫는다", async () => {
    const extra = blocks[1];
    const { frames, end, isCanceled } = await readAll([...blocks, extra], {
      end: "open",
    });
    expect(frames).toEqual(fixture.frames);
    expect(end.reason).toBe("terminal");
    expect(isCanceled()).toBe(true);
  });

  it("onFrame이 던지면 연결을 닫고 그 오류를 던진다", async () => {
    const testStream = createTestStream(blocks, { end: "open" });
    const failure = new Error("reducer 실패");
    await expect(
      readRunStream(testStream.stream, {
        onFrame: () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
    expect(testStream.isCanceled()).toBe(true);
  });
});

describe("readRunStream — protocol 오류", () => {
  const fixture = getStreamFixture("canceled-pending");
  const [firstBlock, secondBlock] = splitBlocks(fixture.sse);
  const firstId = lastIdOf(fixture.frames.slice(0, 1));

  it.each([
    [
      "JSON이 아닌 data",
      `event: run.canceled\nid: ${fixture.runId}:2\ndata: {oops\n\n`,
    ],
    [
      "event와 type 불일치",
      secondBlock.replace("event: run.canceled", "event: run.failed"),
    ],
    [
      "id와 runId:seq 불일치",
      secondBlock.replace(`${fixture.runId}:2`, `${fixture.runId}:3`),
    ],
    ["id 없음", secondBlock.replace(/^id: .*\n/m, "")],
    [
      "알 수 없는 type",
      `event: run.paused\nid: ${fixture.runId}:2\ndata: {"type":"run.paused","runId":"${fixture.runId}","seq":2}\n\n`,
    ],
  ])("%s → interrupted(protocol), 앞 frame cursor 유지", async (_name, bad) => {
    const { frames, end } = await readAll([firstBlock, bad, secondBlock]);
    expect(frames).toEqual(fixture.frames.slice(0, 1));
    expect(end).toMatchObject({
      reason: "interrupted",
      cause: "protocol",
      lastEventId: firstId,
    });
  });

  it.each([
    ["seq 0", 0],
    ["seq 음수", -1],
    ["seq 소수", 1.5],
    ["seq 2^53", 2 ** 53],
  ])("%s → cursor로 쓰지 않고 protocol 오류", async (_name, seq) => {
    const data = { ...fixture.frames[0], seq };
    const bad = `event: run.created\nid: ${fixture.runId}:${seq}\ndata: ${JSON.stringify(data)}\n\n`;
    const { frames, end } = await readAll([bad]);
    expect(frames).toEqual([]);
    expect(end).toMatchObject({
      reason: "interrupted",
      cause: "protocol",
      lastEventId: null,
    });
  });

  it("runId가 소문자 UUID가 아니면 protocol 오류", async () => {
    const runId = fixture.runId.toUpperCase();
    const data = { ...fixture.frames[0], runId };
    const bad = `event: run.created\nid: ${runId}:1\ndata: ${JSON.stringify(data)}\n\n`;
    const { end } = await readAll([bad]);
    expect(end).toMatchObject({ reason: "interrupted", cause: "protocol" });
  });

  it("GET 재접속에서 다른 run의 frame은 protocol 오류", async () => {
    const other = getStreamFixture("substantive-completed");
    const { frames, end } = await readAll(
      [other.sse],
      {},
      {
        runId: fixture.runId,
      },
    );
    expect(frames).toEqual([]);
    expect(end).toMatchObject({ reason: "interrupted", cause: "protocol" });
  });

  it("POST는 첫 frame의 runId로 고정한다", async () => {
    const other = getStreamFixture("substantive-completed");
    const { frames, end } = await readAll([
      firstBlock,
      splitBlocks(other.sse)[1],
    ]);
    expect(frames).toEqual(fixture.frames.slice(0, 1));
    expect(end).toMatchObject({ reason: "interrupted", cause: "protocol" });
  });
});

describe("createSseParser", () => {
  const parse = (...parts: string[]) => {
    const messages: SseMessage[] = [];
    const parser = createSseParser((message) => messages.push(message));
    parts.forEach(parser.feed);
    return messages;
  };

  it("여러 data 줄은 \\n으로 잇고, 콜론 뒤 공백은 한 칸만 뗀다", () => {
    expect(parse("event: a\nid: 1\ndata:  x\ndata:y\n\n")).toEqual([
      { event: "a", id: "1", data: " x\ny" },
    ]);
  });

  it("event가 없으면 message, id는 블록마다 새로 본다", () => {
    expect(parse("id: 1\ndata: a\n\ndata: b\n\n")).toEqual([
      { event: "message", id: "1", data: "a" },
      { event: "message", id: null, data: "b" },
    ]);
  });

  it("comment·retry·data 없는 블록은 메시지가 아니다", () => {
    expect(parse(": heartbeat\n\nretry: 10\n\nevent: x\nid: 2\n\n")).toEqual(
      [],
    );
  });

  it("CR로 끝난 조각 뒤 LF로 시작하는 조각은 CRLF 하나다", () => {
    expect(parse("data: a\r", "\n\r", "\n")).toEqual([
      { event: "message", id: null, data: "a" },
    ]);
    expect(parse("data: a\r", "", "\n\r", "", "\n")).toEqual([
      { event: "message", id: null, data: "a" },
    ]);
  });
});

describe("readRunStream — 무수신 watchdog (#315)", () => {
  const fixture = getStreamFixture("canceled-running");
  const blocks = splitBlocks(fixture.sse);
  const { comment } = getHeartbeatFixture();

  /** 테스트가 바이트를 밀어 넣는 열린 연결(서버가 닫지 않는다) */
  const createPushStream = () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let isCanceled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
      },
      cancel() {
        isCanceled = true;
      },
    });
    return {
      stream,
      push: (text: string) => controller.enqueue(encodeSse(text)),
      isCanceled: () => isCanceled,
    };
  };

  /** microtask를 비워 reader가 밀어 넣은 바이트를 처리하게 한다. */
  const flush = () => vi.advanceTimersByTimeAsync(0);

  it("기본 감시 시간은 heartbeat(15초) 3회분이다", () => {
    expect(RUN_STREAM_IDLE_TIMEOUT_MS).toBe(45_000);
  });

  it("heartbeat가 계속 오면 감시 시간을 넘겨도 끊지 않는다", async () => {
    vi.useFakeTimers();
    try {
      const push = createPushStream();
      const frames: BrowserFrame[] = [];
      const reading = readRunStream(push.stream, {
        onFrame: (frame) => frames.push(frame),
      });
      push.push(blocks[0]);
      for (let elapsed = 0; elapsed < 120_000; elapsed += 15_000) {
        await vi.advanceTimersByTimeAsync(15_000);
        push.push(comment);
      }
      await flush();
      expect(push.isCanceled()).toBe(false);
      for (const block of blocks.slice(1)) push.push(block);
      const end = await reading;
      expect(end.reason).toBe("terminal");
      expect(frames).toEqual(fixture.frames);
      // terminal 뒤에는 감시 timer가 남지 않는다.
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("마지막 수신 뒤 감시 시간 동안 아무것도 오지 않으면 끊고 마지막 frame id를 cursor로 돌려준다", async () => {
    vi.useFakeTimers();
    try {
      const push = createPushStream();
      const frames: BrowserFrame[] = [];
      const reading = readRunStream(push.stream, {
        onFrame: (frame) => frames.push(frame),
      });
      push.push(blocks[0] + blocks[1]);
      await vi.advanceTimersByTimeAsync(30_000);
      push.push(comment); // heartbeat도 수신이다 — 여기서 다시 센다
      await vi.advanceTimersByTimeAsync(RUN_STREAM_IDLE_TIMEOUT_MS - 1);
      expect(push.isCanceled()).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      const end = await reading;
      expect(end).toEqual({
        reason: "interrupted",
        cause: "stalled",
        lastEventId: lastIdOf(fixture.frames.slice(0, 2)),
      });
      expect(frames).toEqual(fixture.frames.slice(0, 2));
      expect(push.isCanceled()).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("frame 없이 멈추면 연결 때 보낸 cursor를 돌려준다", async () => {
    vi.useFakeTimers();
    try {
      const cursor = toEventId(fixture.runId, 3);
      const push = createPushStream();
      const reading = readRunStream(push.stream, {
        onFrame: () => {},
        lastEventId: cursor,
        idleTimeoutMs: 1_000,
      });
      await vi.advanceTimersByTimeAsync(1_000);
      expect(await reading).toEqual({
        reason: "interrupted",
        cause: "stalled",
        lastEventId: cursor,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("abort는 watchdog보다 먼저다(aborted) — 감시 timer를 남기지 않는다", async () => {
    vi.useFakeTimers();
    try {
      const push = createPushStream();
      const controller = new AbortController();
      const reading = readRunStream(push.stream, {
        onFrame: () => {},
        signal: controller.signal,
      });
      push.push(blocks[0]);
      await vi.advanceTimersByTimeAsync(10_000);
      controller.abort();
      expect((await reading).reason).toBe("aborted");
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("idleTimeoutMs가 null이면 감시하지 않는다", async () => {
    vi.useFakeTimers();
    try {
      const push = createPushStream();
      const controller = new AbortController();
      const reading = readRunStream(push.stream, {
        onFrame: () => {},
        signal: controller.signal,
        idleTimeoutMs: null,
      });
      await flush();
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(10 * RUN_STREAM_IDLE_TIMEOUT_MS);
      expect(push.isCanceled()).toBe(false);
      controller.abort();
      expect((await reading).reason).toBe("aborted");
    } finally {
      vi.useRealTimers();
    }
  });
});
