import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createRunApiClient, RunApiError } from "@/features/run/api";
import type { RunStreamEnd } from "@/features/run/api";
import { reduceFrames, selectActivities } from "@/features/run/model";
import type { BrowserFrame } from "@/shared/contracts/browser_run_v1";
import {
  getStreamFixture,
  listStreamFixtures,
  readContractJson,
} from "@/test/contracts/browser_run_fixtures";
import { parseWire } from "@/test/contracts/browser_run_schema";
import { createBrowserRunMockServer } from "./browser_run_mock_server";
import {
  getStreamTemplate,
  STREAM_TEMPLATE_NAMES,
} from "./browser_run_stream_templates";
import type { StreamTemplateName } from "./browser_run_stream_templates";

const BASE_URL = "http://mock.test";
const mock = createBrowserRunMockServer({ baseUrl: BASE_URL });
const server = setupServer(...mock.handlers);
const api = createRunApiClient({
  baseUrl: BASE_URL,
  auth: { getAccessToken: () => "test-token" },
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => mock.reset());
afterAll(() => server.close());

const rawFetch = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL}${path}`, init);
  return { status: response.status, body: (await response.json()) as unknown };
};

const collect = async (
  open: (onFrame: (frame: BrowserFrame) => void) => Promise<RunStreamEnd>,
) => {
  const frames: BrowserFrame[] = [];
  const end = await open((frame) => frames.push(frame));
  return { frames, end };
};

const question = (noteId?: string) => ({
  requestId: crypto.randomUUID(),
  ...(noteId !== undefined && { noteId }),
  text: "이 문제를 풀어줘",
});

describe("stream template", () => {
  it("streams/valid fixture 10개를 모두 template으로 쓴다", () => {
    expect(STREAM_TEMPLATE_NAMES).toEqual(
      listStreamFixtures().map((fixture) => fixture.name),
    );
    for (const fixture of listStreamFixtures())
      expect(
        getStreamTemplate(fixture.name as StreamTemplateName).frames,
      ).toEqual(fixture.frames);
  });

  it.each(STREAM_TEMPLATE_NAMES)(
    "%s: 새 run의 frame은 schema를 통과하고 ID만 fixture와 다르다",
    (name) => {
      const runId = mock.seedRun({
        template: name as StreamTemplateName,
        noteId: "77",
        committed: Number.MAX_SAFE_INTEGER,
      });
      const run = mock.getRun(runId)!;
      const fixture = getStreamFixture(name);
      expect(run.frames).toHaveLength(fixture.frames.length);
      run.frames.forEach((frame, index) => {
        parseWire("BrowserFrame", frame, `${name}[${index}]`);
        expect(frame.runId).toBe(runId);
        expect(frame.seq).toBe(fixture.frames[index].seq);
        expect(frame.type).toBe(fixture.frames[index].type);
      });
      const created = run.frames[0];
      expect(created.type === "run.created" && created.payload.noteId).toBe(
        "77",
      );
      // 같은 frame 열을 reducer에 넣으면 fixture와 같은 Activity·page가 나온다(ID 외 내용 동일).
      const ours = reduceFrames(run.frames);
      const theirs = reduceFrames(fixture.frames);
      expect(selectActivities(ours)).toEqual(selectActivities(theirs));
      expect(ours.pages).toEqual(theirs.pages);
      expect(ours.status).toBe(fixture.finalStatus);
    },
  );
});

describe("POST /api/conversations", () => {
  it("새 질문은 seq 1부터 terminal까지 보내고 첫 질문이면 새 Note를 만든다", async () => {
    const { frames, end } = await collect((onFrame) =>
      api.streamConversation(question(), { onFrame }),
    );
    expect(end.reason).toBe("terminal");
    expect(frames.map((frame) => frame.seq)).toEqual(
      getStreamFixture("substantive-completed").frames.map((f) => f.seq),
    );
    const created = frames[0];
    expect(created.type === "run.created" && created.payload.noteId).toBe(
      "9001",
    );
  });

  it("같은 requestId 재전송은 같은 run을 seq 1부터 replay하고 run을 늘리지 않는다", async () => {
    const request = question("5");
    const first = await collect((onFrame) =>
      api.streamConversation(request, { onFrame }),
    );
    const second = await collect((onFrame) =>
      api.streamConversation(request, { onFrame }),
    );
    expect(second.frames).toEqual(first.frames);
    expect(mock.listRunIds()).toHaveLength(1);
  });

  it("같은 requestId에 다른 의미면 RUN4092", async () => {
    const request = question("5");
    await api.streamConversation(request, { onFrame: () => {} });
    const end = await api.streamConversation(
      { ...request, text: "다른 질문" },
      { onFrame: () => {} },
    );
    expect(end.reason === "rejected" && end.error.code).toBe("RUN4092");
  });

  it("Note에 Active Run이 있으면 409 RUN4091 activeRunId", async () => {
    const activeRunId = mock.seedRun({ noteId: "5", committed: 3 });
    const end = await api.streamConversation(question("5"), {
      onFrame: () => {},
    });
    expect(end.reason).toBe("rejected");
    if (end.reason !== "rejected") return;
    expect(end.error.detail).toMatchObject({ code: "RUN4091", activeRunId });
  });

  it.each([
    ["RUN4291", 429, 30],
    ["RUN4021", 402, undefined],
    ["RUN4221", 422, undefined],
  ] as const)("예약 거부 %s → HTTP %i", async (code, http, retryAfter) => {
    mock.rejectNextConversation({ code, retryAfterSeconds: retryAfter });
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question("5")),
    });
    expect(response.status).toBe(http);
    const body = parseWire("ErrorResponse", await response.json());
    expect(body.code).toBe(code);
    expect(response.headers.get("Retry-After")).toBe(
      retryAfter === undefined ? null : String(retryAfter),
    );
  });

  it("형식 위반은 RUN4001", async () => {
    const { status, body } = await rawFetch("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ text: "requestId 없음" }),
    });
    expect(status).toBe(400);
    expect(parseWire("ErrorResponse", body).code).toBe("RUN4001");
  });
});

describe("GET /api/ai-runs/{runId}/events", () => {
  it("cursor 다음 seq부터 보내고, commit을 기다렸다가 live로 이어 보낸다", async () => {
    const runId = mock.seedRun({ noteId: "5", committed: 4 });
    const frames: BrowserFrame[] = [];
    const ending = api.streamRunEvents(
      runId,
      { lastEventId: `${runId}:2` },
      {
        onFrame: (frame) => {
          frames.push(frame);
          if (frame.seq === 4) mock.commit(runId);
        },
      },
    );
    expect((await ending).reason).toBe("terminal");
    expect(frames[0].seq).toBe(3);
    expect(frames.at(-1)?.type).toBe("run.completed");
    expect(mock.getOpenConnections()).toBe(0);
  });

  it("terminal run에 마지막 cursor로 붙으면 0 frame 뒤 닫는다", async () => {
    const runId = mock.seedRun({ noteId: "5" });
    const lastSeq = mock.getRun(runId)!.committed;
    const { frames, end } = await collect((onFrame) =>
      api.streamRunEvents(
        runId,
        { lastEventId: `${runId}:${lastSeq}` },
        { onFrame },
      ),
    );
    expect(frames).toEqual([]);
    expect(end.reason).toBe("interrupted"); // terminal frame이 없으므로 reader 기준 eof
  });

  it("disconnect 장애: afterFrames개 뒤 terminal 없이 끊는다(eof·network)", async () => {
    const runId = mock.seedRun({ noteId: "5" });
    mock.injectFault("events", { kind: "disconnect", afterFrames: 3 });
    mock.injectFault("events", {
      kind: "disconnect",
      afterFrames: 2,
      mode: "network",
    });
    const eof = await collect((onFrame) =>
      api.streamRunEvents(runId, {}, { onFrame }),
    );
    expect(eof.frames).toHaveLength(3);
    expect(eof.end).toMatchObject({ reason: "interrupted", cause: "eof" });
    const network = await collect((onFrame) =>
      api.streamRunEvents(runId, {}, { onFrame }),
    );
    expect(network.frames).toHaveLength(2);
    expect(network.end).toMatchObject({
      reason: "interrupted",
      cause: "network",
    });
  });

  it("duplicate·ignore-cursor 장애는 이미 보낸 seq를 다시 보낸다", async () => {
    const runId = mock.seedRun({ noteId: "5" });
    mock.injectFault("events", { kind: "duplicate" });
    const duplicated = await collect((onFrame) =>
      api.streamRunEvents(runId, {}, { onFrame }),
    );
    const seqs = duplicated.frames.map((frame) => frame.seq);
    expect(seqs.slice(0, 4)).toEqual([1, 1, 2, 2]);

    mock.injectFault("events", { kind: "ignore-cursor" });
    const replayed = await collect((onFrame) =>
      api.streamRunEvents(runId, { lastEventId: `${runId}:5` }, { onFrame }),
    );
    expect(replayed.frames[0].seq).toBe(1);
  });

  it("error 장애는 stream 전 계약 밖 500 JSON", async () => {
    const runId = mock.seedRun({ noteId: "5" });
    mock.injectFault("events", { kind: "error" });
    const end = await api.streamRunEvents(runId, {}, { onFrame: () => {} });
    expect(end.reason).toBe("rejected");
    if (end.reason !== "rejected") return;
    expect(end.error.detail).toMatchObject({
      code: null,
      status: 500,
      rawCode: "COMMON500",
    });
  });

  it("Note 삭제: 열린 연결은 frame 없이 닫히고 재접속은 RUN4041", async () => {
    const runId = mock.seedRun({ noteId: "5", committed: 2 });
    const first = collect((onFrame) =>
      api.streamRunEvents(
        runId,
        {},
        {
          onFrame: (frame) => {
            onFrame(frame);
            if (frame.seq === 2) mock.deleteNote("5");
          },
        },
      ),
    );
    expect((await first).end).toMatchObject({
      reason: "interrupted",
      cause: "eof",
    });
    const second = await api.streamRunEvents(
      runId,
      { lastEventId: `${runId}:2` },
      { onFrame: () => {} },
    );
    expect(second.reason === "rejected" && second.error.code).toBe("RUN4041");
  });

  it("다른 run의 cursor는 RUN4004, 형식 오류는 RUN4003", async () => {
    const runId = mock.seedRun({ noteId: "5" });
    const other = mock.seedRun({ noteId: "6" });
    // client는 다른 run cursor를 보내기 전에 TypeError로 막으므로 handler 판정은 raw fetch로 본다.
    const response = await fetch(`${BASE_URL}/api/ai-runs/${runId}/events`, {
      headers: { "Last-Event-ID": `${other}:1` },
    });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { code: string }).code).toBe("RUN4004");
    const malformed = await fetch(`${BASE_URL}/api/ai-runs/${runId}/events`, {
      headers: { "Last-Event-ID": `${runId}:0` },
    });
    expect(((await malformed.json()) as { code: string }).code).toBe("RUN4003");
  });
});

describe("POST /api/ai-runs/{runId}/cancel (cancel/cases.json)", () => {
  interface CancelCase {
    name: string;
    rawBody: string | null;
    run:
      | "running"
      | "canceling"
      | "completed"
      | "pending"
      | "missing"
      | "other_user";
    expected: {
      http: number;
      fixture?: string;
      status?: string;
      code?: string;
    };
  }
  const { cases } = readContractJson<{ cases: CancelCase[] }>(
    "cancel/cases.json",
  );

  const prepare = async (kind: CancelCase["run"]) => {
    switch (kind) {
      case "running":
        return mock.seedRun({ template: "canceled-running", noteId: "5" });
      case "pending":
        return mock.seedRun({ template: "canceled-pending", noteId: "5" });
      case "completed":
        return mock.seedRun({ noteId: "5" });
      case "canceling": {
        const runId = mock.seedRun({
          template: "canceled-running",
          noteId: "5",
        });
        // run.canceling까지 commit된 상태(확정 대기)
        mock.commit(runId, 1);
        return runId;
      }
      case "missing":
      case "other_user":
        return crypto.randomUUID();
    }
  };

  it.each(cases.map((testCase) => [testCase.name, testCase] as const))(
    "%s",
    async (_name, testCase) => {
      const runId = await prepare(testCase.run);
      const { status, body } = await rawFetch(`/api/ai-runs/${runId}/cancel`, {
        method: "POST",
        ...(testCase.rawBody !== null && { body: testCase.rawBody }),
      });
      expect(status).toBe(testCase.expected.http);
      if (testCase.expected.code) {
        expect(parseWire("ErrorResponse", body).code).toBe(
          testCase.expected.code,
        );
        return;
      }
      const response = parseWire("RunCancelResponse", body);
      const fixture = readContractJson<{
        body: { result: { outcome: string } };
      }>(`${testCase.expected.fixture}.json`);
      expect(response.result.status).toBe(testCase.expected.status);
      expect(response.result.outcome).toBe(fixture.body.result.outcome);
      expect(response.result.runId).toBe(runId);
    },
  );

  it("취소 분기가 없는 template은 run.canceling·열린 Activity 취소·run.canceled를 붙인다(schema·reducer 통과)", async () => {
    const runId = mock.seedRun({ noteId: "5", committed: 5 }); // activity-2 started, 열림
    const result = await api.cancelRun(runId);
    expect(result).toMatchObject({ status: "CANCELING", outcome: "accepted" });
    const run = mock.getRun(runId)!;
    expect(run.frames.slice(5).map((frame) => frame.type)).toEqual([
      "run.canceling",
      "activity.canceled",
      "run.canceled",
    ]);
    run.frames.forEach((frame) => parseWire("BrowserFrame", frame));
    const state = reduceFrames(run.frames);
    expect(state.status).toBe("CANCELED");
    expect(selectActivities(state).map((activity) => activity.phase)).toEqual([
      "completed",
      "canceled",
    ]);
  });

  it("holdCancelConfirmation이면 CANCELING에서 확정을 기다린다", async () => {
    const holding = createBrowserRunMockServer({
      baseUrl: "http://hold.test",
      holdCancelConfirmation: true,
    });
    server.use(...holding.handlers);
    const holdApi = createRunApiClient({
      baseUrl: "http://hold.test",
      auth: { getAccessToken: () => null },
    });
    const runId = holding.seedRun({
      template: "canceled-running",
      noteId: "5",
    });
    await holdApi.cancelRun(runId);
    expect(holding.getRun(runId)!.status).toBe("CANCELING");
    expect((await holdApi.cancelRun(runId)).outcome).toBe("already_canceling");
    holding.commit(runId);
    expect(holding.getRun(runId)!.status).toBe("CANCELED");
    server.resetHandlers();
  });
});

describe("조회 응답", () => {
  it("대화 조회는 ConversationPageResponse schema를 통과하고 Active Run을 lastSeq와 함께 준다", async () => {
    const done = mock.seedRun({ noteId: "5", text: "첫 질문" });
    mock.seedRun({ template: "failed-verification", noteId: "5" });
    mock.seedRun({
      template: "canceled-pending",
      noteId: "5",
      committed: Number.MAX_SAFE_INTEGER,
    });
    const running = mock.seedRun({ noteId: "5", committed: 4 });
    const { body } = await rawFetch("/api/conversations/5/messages");
    const page = parseWire("ConversationPageResponse", body).result;
    expect(page.activeRun).toEqual({
      runId: running,
      status: "RUNNING",
      lastSeq: 4,
    });
    expect(page.messages.map((message) => message.status)).toEqual([
      "COMPLETED",
      "COMPLETED",
      "COMPLETED",
      "FAILED",
      "COMPLETED",
      "CANCELED",
      "COMPLETED",
      "STREAMING",
    ]);
    expect(page.messages[0]).toMatchObject({
      runId: done,
      user: { text: "첫 질문" },
    });
  });

  it("상태 조회는 RunStatusResponse schema를 통과한다", async () => {
    for (const template of STREAM_TEMPLATE_NAMES) {
      const runId = mock.seedRun({
        template: template as StreamTemplateName,
        noteId: "5",
      });
      const { body } = await rawFetch(`/api/ai-runs/${runId}`);
      parseWire("RunStatusResponse", body, template);
    }
    const running = mock.seedRun({ noteId: "8", committed: 3 });
    expect((await api.getRunStatus(running)).cancelable).toBe(true);
    await expect(api.getRunStatus(crypto.randomUUID())).rejects.toBeInstanceOf(
      RunApiError,
    );
  });
});
