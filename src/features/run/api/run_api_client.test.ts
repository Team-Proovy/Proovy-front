// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { toEventId } from "@/shared/contracts/browser_run_v1";
import type {
  BrowserFrame,
  ConversationRunRequest,
} from "@/shared/contracts/browser_run_v1";
import {
  getConversationFixture,
  getCursorCases,
  getErrorFixture,
  getRequestFixture,
  getRunCancelFixture,
  getRunStatusFixture,
  getStreamFixture,
} from "@/test/contracts/browser_run_fixtures";
import { createRunApiClient, isEventId } from "./run_api_client";
import type { RunApiAuth } from "./run_api_client";
import { RunApiError } from "./run_api_error";
import { createConversationRequest } from "./run_request";
import { jsonResponse, sseResponse } from "./test_streams";

const BASE_URL = "http://localhost:8080";

interface SentRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
}

const setup = (
  responses: (Response | Error)[],
  auth: RunApiAuth = { getAccessToken: () => "access-1" },
) => {
  const sent: SentRequest[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      sent.push({
        url: String(input),
        method: init?.method ?? "GET",
        headers: new Headers(init?.headers),
        body: (init?.body as string | undefined) ?? null,
      });
      if (init?.signal?.aborted)
        throw new DOMException("aborted", "AbortError");
      const next = responses.shift();
      if (!next) throw new Error("응답 없음");
      if (next instanceof Error) throw next;
      return next;
    },
  );
  const client = createRunApiClient({
    baseUrl: BASE_URL,
    fetch: fetchMock as typeof fetch,
    auth,
  });
  return { client, sent, fetchMock };
};

const collect = () => {
  const frames: BrowserFrame[] = [];
  return { frames, onFrame: (frame: BrowserFrame) => frames.push(frame) };
};

/** 첫 frame 블록만 남긴다(빈 줄 포함). */
const splitFirstBlock = (sse: string) => `${sse.split("\n\n")[0]}\n\n`;

const stream = getStreamFixture("substantive-completed");
const lastId = toEventId(stream.runId, stream.frames.length);

describe("streamConversation — POST /api/conversations", () => {
  it("Authorization·Accept·closed body를 붙여 보내고 frame을 terminal까지 읽는다", async () => {
    const request = getRequestFixture("existing-note-full").request;
    const { client, sent } = setup([sseResponse([stream.sse])]);
    const { frames, onFrame } = collect();
    const onOpen = vi.fn();

    const end = await client.streamConversation(request, { onFrame, onOpen });

    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(`${BASE_URL}/api/conversations`);
    expect(sent[0].method).toBe("POST");
    expect(sent[0].headers.get("Authorization")).toBe("Bearer access-1");
    expect(sent[0].headers.get("Accept")).toBe("text/event-stream");
    expect(sent[0].headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(sent[0].body!)).toEqual(request);
    expect(onOpen).toHaveBeenCalledOnce();
    expect(frames).toEqual(stream.frames);
    expect(end).toMatchObject({ reason: "terminal", lastEventId: lastId });
  });

  it("첫 질문 body에는 noteId가 없다", async () => {
    const { client, sent } = setup([sseResponse([stream.sse])]);
    const check = createConversationRequest({ text: "풀어줘" });
    if (!check.ok) throw new Error("요청 생성 실패");
    await client.streamConversation(check.request, collect());
    expect(Object.keys(JSON.parse(sent[0].body!))).toEqual([
      "requestId",
      "text",
    ]);
  });

  it("같은 전송 재시도는 같은 requestId body를 보낸다", async () => {
    const { client, sent } = setup([
      sseResponse([splitFirstBlock(stream.sse)], { end: "error" }),
      sseResponse([stream.sse]),
    ]);
    const check = createConversationRequest({ noteId: "123", text: "풀어줘" });
    if (!check.ok) throw new Error("요청 생성 실패");
    const first = await client.streamConversation(check.request, collect());
    expect(first).toMatchObject({ reason: "interrupted", cause: "network" });
    await client.streamConversation(check.request, collect());
    expect(sent[1].body).toBe(sent[0].body);
  });

  it("계약에 맞지 않는 요청은 보내지 않는다", async () => {
    const { client, fetchMock } = setup([]);
    const invalid = {
      requestId: "7f460a7b-bf54-570e-a3af-b63a26435627",
      text: "a",
      locale: "ko",
    } as unknown as ConversationRunRequest;
    await expect(client.streamConversation(invalid, collect())).rejects.toThrow(
      TypeError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("409 RUN4091 → rejected, activeRunId", async () => {
    const fixture = getErrorFixture("RUN4091");
    const { client } = setup([jsonResponse(fixture.http, fixture.body)]);
    const { frames, onFrame } = collect();
    const onOpen = vi.fn();
    const end = await client.streamConversation(
      getRequestFixture("first-no-note").request,
      { onFrame, onOpen },
    );
    expect(end.reason).toBe("rejected");
    if (end.reason === "rejected") {
      expect(end.error).toBeInstanceOf(RunApiError);
      expect(end.error.detail).toMatchObject({
        status: 409,
        code: "RUN4091",
        activeRunId:
          fixture.body.code === "RUN4091" && fixture.body.result.activeRunId,
      });
    }
    expect(frames).toEqual([]);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("429 RUN4291 → rejected, Retry-After", async () => {
    const fixture = getErrorFixture("RUN4291");
    const { client } = setup([
      jsonResponse(fixture.http, fixture.body, { "Retry-After": "12" }),
    ]);
    const end = await client.streamConversation(
      getRequestFixture("first-no-note").request,
      collect(),
    );
    expect(end).toMatchObject({
      reason: "rejected",
      error: {
        detail: { status: 429, code: "RUN4291", retryAfterSeconds: 12 },
      },
    });
  });

  it("200인데 SSE가 아니면 계약 밖 rejected", async () => {
    const { client } = setup([jsonResponse(200, { isSuccess: true })]);
    const end = await client.streamConversation(
      getRequestFixture("first-no-note").request,
      collect(),
    );
    expect(end).toMatchObject({
      reason: "rejected",
      error: { detail: { code: null, status: 200 } },
    });
  });

  it("fetch 실패는 interrupted(network), abort는 aborted", async () => {
    const request = getRequestFixture("first-no-note").request;
    const failing = setup([new TypeError("Failed to fetch")]);
    expect(
      await failing.client.streamConversation(request, collect()),
    ).toMatchObject({
      reason: "interrupted",
      cause: "network",
      lastEventId: null,
    });

    const controller = new AbortController();
    controller.abort();
    const aborted = setup([sseResponse([stream.sse])]);
    expect(
      await aborted.client.streamConversation(request, {
        ...collect(),
        signal: controller.signal,
      }),
    ).toEqual({ reason: "aborted", lastEventId: null });
  });
});

describe("401 token 갱신", () => {
  const unauthorized = () =>
    jsonResponse(401, getErrorFixture("AUTH4012").body);

  it("stream 전 401이면 한 번 갱신하고 새 token으로 같은 요청을 보낸다", async () => {
    let token = "expired";
    const refreshAccessToken = vi.fn(async () => (token = "access-2"));
    const { client, sent } = setup(
      [unauthorized(), sseResponse([stream.sse])],
      {
        getAccessToken: () => token,
        refreshAccessToken,
      },
    );
    const request = getRequestFixture("first-no-note").request;
    const end = await client.streamConversation(request, collect());

    expect(end.reason).toBe("terminal");
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(sent.map((item) => item.headers.get("Authorization"))).toEqual([
      "Bearer expired",
      "Bearer access-2",
    ]);
    expect(sent[1].body).toBe(sent[0].body);
  });

  it("갱신 실패면 처음 401을 typed 오류로 돌려준다", async () => {
    const { client, sent } = setup([unauthorized()], {
      getAccessToken: () => "expired",
      refreshAccessToken: () => Promise.reject(new Error("refresh 실패")),
    });
    const end = await client.streamConversation(
      getRequestFixture("first-no-note").request,
      collect(),
    );
    expect(end).toMatchObject({
      reason: "rejected",
      error: { detail: { status: 401, code: "AUTH4012" } },
    });
    expect(sent).toHaveLength(1);
  });

  it("재시도도 401이면 다시 갱신하지 않는다", async () => {
    const refreshAccessToken = vi.fn(async () => "access-2");
    const { client } = setup([unauthorized(), unauthorized()], {
      getAccessToken: () => "expired",
      refreshAccessToken,
    });
    await expect(client.getRunStatus(stream.runId)).rejects.toMatchObject({
      detail: { status: 401, code: "AUTH4012" },
    });
    expect(refreshAccessToken).toHaveBeenCalledOnce();
  });

  it("token이 없으면 Authorization을 붙이지 않는다", async () => {
    const { client, sent } = setup(
      [jsonResponse(401, getErrorFixture("AUTH4010").body)],
      { getAccessToken: () => null },
    );
    await expect(client.getRunStatus(stream.runId)).rejects.toMatchObject({
      detail: { code: "AUTH4010" },
    });
    expect(sent[0].headers.has("Authorization")).toBe(false);
  });
});

describe("streamRunEvents — GET /api/ai-runs/{runId}/events", () => {
  it("cursor 없이 seq 1부터 읽는다", async () => {
    const { client, sent } = setup([sseResponse([stream.sse])]);
    const { frames, onFrame } = collect();
    const end = await client.streamRunEvents(stream.runId, {}, { onFrame });
    expect(sent[0].url).toBe(`${BASE_URL}/api/ai-runs/${stream.runId}/events`);
    expect(sent[0].method).toBe("GET");
    expect(sent[0].headers.has("Last-Event-ID")).toBe(false);
    expect(sent[0].headers.get("Accept")).toBe("text/event-stream");
    expect(frames).toEqual(stream.frames);
    expect(end).toMatchObject({ reason: "terminal", lastEventId: lastId });
  });

  it("cursor는 기본 Last-Event-ID header로 보내고, 이어지는 frame만 받는다", async () => {
    const cursor = toEventId(stream.runId, 3);
    const rest = stream.sse.split("\n\n").slice(3).join("\n\n");
    const { client, sent } = setup([sseResponse([rest])]);
    const { frames, onFrame } = collect();
    const end = await client.streamRunEvents(
      stream.runId,
      { lastEventId: cursor },
      { onFrame },
    );
    expect(sent[0].headers.get("Last-Event-ID")).toBe(cursor);
    expect(sent[0].url).not.toContain("lastEventId");
    expect(frames).toEqual(stream.frames.slice(3));
    expect(end).toMatchObject({ reason: "terminal", lastEventId: lastId });
  });

  it("placement query면 ?lastEventId=로 보낸다", async () => {
    const cursor = toEventId(stream.runId, 3);
    const { client, sent } = setup([sseResponse([])]);
    await client.streamRunEvents(
      stream.runId,
      { lastEventId: cursor, placement: "query" },
      collect(),
    );
    const url = new URL(sent[0].url);
    expect(url.pathname).toBe(`/api/ai-runs/${stream.runId}/events`);
    expect(url.searchParams.get("lastEventId")).toBe(cursor);
    expect(sent[0].headers.has("Last-Event-ID")).toBe(false);
  });

  it("terminal run에 마지막 cursor로 붙으면 0 frame 종료 — cursor 그대로", async () => {
    const { client } = setup([sseResponse([])]);
    const end = await client.streamRunEvents(
      stream.runId,
      { lastEventId: lastId },
      collect(),
    );
    expect(end).toEqual({
      reason: "interrupted",
      cause: "eof",
      lastEventId: lastId,
    });
  });

  it("400 RUN4003·404 RUN4041은 rejected", async () => {
    for (const code of ["RUN4003", "RUN4041"] as const) {
      const fixture = getErrorFixture(code);
      const { client } = setup([jsonResponse(fixture.http, fixture.body)]);
      const end = await client.streamRunEvents(
        stream.runId,
        { lastEventId: lastId },
        collect(),
      );
      expect(end).toMatchObject({
        reason: "rejected",
        error: { detail: { code, status: fixture.http } },
        lastEventId: lastId,
      });
    }
  });

  it("cursor 판정표: schema가 거부하는 값은 isEventId가 거부하고 보내지 않는다", async () => {
    const { runs, cases } = getCursorCases();
    for (const testCase of cases) {
      const runId = runs[testCase.run]?.runId ?? stream.runId;
      for (const raw of [
        testCase.lastEventIdHeader,
        testCase.lastEventIdQuery,
      ]) {
        if (raw == null) continue;
        const value = raw.replaceAll("{runId}", runId);
        expect(
          isEventId(value),
          `${testCase.name}: ${JSON.stringify(value)}`,
        ).toBe(!testCase.schemaRejects);
      }
    }
    const { client, fetchMock } = setup([]);
    await expect(
      client.streamRunEvents(
        stream.runId,
        { lastEventId: `${stream.runId}:03` },
        collect(),
      ),
    ).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("대문자 runId·다른 run의 cursor는 보내지 않는다", async () => {
    const { client, fetchMock } = setup([]);
    await expect(
      client.streamRunEvents(stream.runId.toUpperCase(), {}, collect()),
    ).rejects.toThrow(TypeError);
    const otherRunCursor = toEventId(
      getStreamFixture("canceled-pending").runId,
      1,
    );
    await expect(
      client.streamRunEvents(
        stream.runId,
        { lastEventId: otherRunCursor },
        collect(),
      ),
    ).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("body 읽기·갱신 중 abort·네트워크 실패", () => {
  /** body를 읽기 시작하면 실패하는 오류 응답 */
  const brokenErrorResponse = (status: number) =>
    new Response(
      new ReadableStream({
        pull(controller) {
          controller.error(new TypeError("network error"));
        },
      }),
      { status, headers: { "Content-Type": "application/json" } },
    );

  it("stream 전 오류 body를 읽다 끊기면 rejected가 아니라 interrupted(network)", async () => {
    const { client } = setup([brokenErrorResponse(409)]);
    expect(
      await client.streamConversation(
        getRequestFixture("first-no-note").request,
        collect(),
      ),
    ).toMatchObject({ reason: "interrupted", cause: "network" });
  });

  it("JSON 함수는 body 읽기 실패를 계약 밖 오류로 바꾸지 않고 던진다", async () => {
    const ok = new Response(
      new ReadableStream({
        pull(controller) {
          controller.error(new TypeError("network error"));
        },
      }),
      { status: 200 },
    );
    const { client } = setup([ok, brokenErrorResponse(404)]);
    await expect(client.getRunStatus(stream.runId)).rejects.toBeInstanceOf(
      TypeError,
    );
    await expect(client.cancelRun(stream.runId)).rejects.toBeInstanceOf(
      TypeError,
    );
  });

  it("401 갱신을 기다리는 중 abort하면 바로 aborted, 재요청하지 않는다", async () => {
    const controller = new AbortController();
    const refreshAccessToken = vi.fn(() => new Promise<string>(() => {}));
    const { client, sent } = setup(
      [jsonResponse(401, getErrorFixture("AUTH4012").body)],
      { getAccessToken: () => "expired", refreshAccessToken },
    );
    const endPromise = client.streamConversation(
      getRequestFixture("first-no-note").request,
      { ...collect(), signal: controller.signal },
    );
    await vi.waitFor(() => expect(refreshAccessToken).toHaveBeenCalled());
    controller.abort();
    expect(await endPromise).toEqual({ reason: "aborted", lastEventId: null });
    expect(sent).toHaveLength(1);
  });

  it("JSON 함수도 갱신 대기 중 abort되면 abort reason으로 reject", async () => {
    const controller = new AbortController();
    const { client } = setup(
      [jsonResponse(401, getErrorFixture("AUTH4012").body)],
      {
        getAccessToken: () => "expired",
        refreshAccessToken: () => new Promise<string>(() => {}),
      },
    );
    const pending = client.getRunStatus(stream.runId, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("JSON API", () => {
  it("getRunStatus — GET /api/ai-runs/{runId} → result", async () => {
    const fixture = getRunStatusFixture("status-running");
    const { client, sent } = setup([jsonResponse(200, fixture.body)]);
    const status = await client.getRunStatus(fixture.body.result.runId);
    expect(sent[0]).toMatchObject({
      url: `${BASE_URL}/api/ai-runs/${fixture.body.result.runId}`,
      method: "GET",
      body: null,
    });
    expect(sent[0].headers.get("Accept")).toBe("application/json");
    expect(status).toEqual(fixture.body.result);
  });

  it("cancelRun — POST /api/ai-runs/{runId}/cancel, body·Content-Type 없음", async () => {
    const fixture = getRunCancelFixture("cancel-accepted-running");
    const { client, sent } = setup([jsonResponse(200, fixture.body)]);
    const result = await client.cancelRun(fixture.body.result.runId);
    expect(sent[0]).toMatchObject({
      url: `${BASE_URL}/api/ai-runs/${fixture.body.result.runId}/cancel`,
      method: "POST",
      body: null,
    });
    expect(sent[0].headers.has("Content-Type")).toBe(false);
    expect(sent[0].headers.get("Authorization")).toBe("Bearer access-1");
    expect(result).toEqual(fixture.body.result);
  });

  it("getConversationMessages — before·limit query", async () => {
    const fixture = getConversationFixture("conversation-completed");
    const page = fixture.body.result;
    const before = page.messages[0].messageId;
    const { client, sent } = setup([
      jsonResponse(200, fixture.body),
      jsonResponse(200, fixture.body),
    ]);

    expect(await client.getConversationMessages(page.noteId)).toEqual(page);
    expect(sent[0].url).toBe(
      `${BASE_URL}/api/conversations/${page.noteId}/messages`,
    );

    await client.getConversationMessages(page.noteId, { before, limit: 20 });
    const url = new URL(sent[1].url);
    expect(url.pathname).toBe(`/api/conversations/${page.noteId}/messages`);
    expect(url.searchParams.get("before")).toBe(before);
    expect(url.searchParams.get("limit")).toBe("20");
  });

  it("오류 응답은 RunApiError로 던진다", async () => {
    const fixture = getErrorFixture("RUN4041");
    const { client } = setup([jsonResponse(fixture.http, fixture.body)]);
    const error = await client
      .cancelRun(stream.runId)
      .catch((caught) => caught);
    expect(error).toBeInstanceOf(RunApiError);
    expect(error.detail).toEqual({
      code: "RUN4041",
      status: 404,
      message: fixture.body.message,
    });
  });

  it("200인데 isSuccess가 아니면 계약 밖 RunApiError", async () => {
    const { client } = setup([new Response("<html/>", { status: 200 })]);
    await expect(client.getRunStatus(stream.runId)).rejects.toMatchObject({
      detail: { code: null, status: 200 },
    });
  });
});
