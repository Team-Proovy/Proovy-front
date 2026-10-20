import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createRunApiClient } from "@/features/run/api";
import {
  reduceFrames,
  selectActivities,
  selectPageBoundaries,
  selectResponse,
} from "@/features/run/model";
import type { RunState } from "@/features/run/model";
import { createBrowserRunMockServer } from "./mocks";
import type { BrowserRunMockServerOptions } from "./mocks";
import { RECONNECT_BACKOFF } from "./reconnect_backoff";
import { createRunSession } from "./run_session";
import type {
  RunSession,
  RunSessionOptions,
  RunSessionSnapshot,
} from "./run_session";

const BASE_URL = "http://mock.test";
const server = setupServer();
const api = createRunApiClient({
  baseUrl: BASE_URL,
  auth: { getAccessToken: () => "test-token" },
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const QUESTION = { text: "이 문제를 풀어줘" };

/**
 * 테스트 환경: fixture mock server + 지연을 기록하고 곧바로(다음 task) 실행하는 timer.
 * backoff 지연은 `delays`로 확인하고 실제로 기다리지 않는다.
 */
const setup = (
  mockOptions: Omit<BrowserRunMockServerOptions, "baseUrl"> = {},
  sessionOptions: RunSessionOptions = {},
) => {
  const mock = createBrowserRunMockServer({
    baseUrl: BASE_URL,
    ...mockOptions,
  });
  server.use(...mock.handlers);
  const delays: number[] = [];
  const sessions: RunSession[] = [];
  const onUnauthorized = vi.fn();
  const create = (options: RunSessionOptions = {}) => {
    const session = createRunSession({
      api,
      random: () => 0.5,
      now: () => 1_000_000,
      onUnauthorized,
      timers: {
        setTimeout: (callback, ms) => {
          delays.push(ms);
          return setTimeout(callback, 0);
        },
        clearTimeout: (handle) =>
          clearTimeout(handle as ReturnType<typeof setTimeout>),
      },
      ...sessionOptions,
      ...options,
    });
    sessions.push(session);
    return session;
  };
  return { mock, delays, create, onUnauthorized, sessions };
};

/** snapshot이 조건을 만족할 때까지 기다린다. */
const waitFor = (
  session: RunSession,
  predicate: (snapshot: RunSessionSnapshot) => boolean,
  label = "조건",
) =>
  new Promise<RunSessionSnapshot>((resolve, reject) => {
    const check = () => {
      const snapshot = session.getSnapshot();
      if (!predicate(snapshot)) return false;
      unsubscribe();
      clearTimeout(timeout);
      resolve(snapshot);
      return true;
    };
    const unsubscribe = session.subscribe(check);
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(
        new Error(
          `${label} 대기 시간 초과: ${JSON.stringify({
            connection: session.getSnapshot().connection,
            status: session.getSnapshot().run.status,
            lastSeq: session.getSnapshot().run.lastSeq,
            problem: session.getSnapshot().problem,
          })}`,
        ),
      );
    }, 3_000);
    check();
  });

const settled = (snapshot: RunSessionSnapshot) =>
  snapshot.connection === "idle" || snapshot.connection === "stopped";

const isTerminal = (snapshot: RunSessionSnapshot) =>
  ["COMPLETED", "FAILED", "CANCELED"].includes(snapshot.run.status ?? "") &&
  settled(snapshot);

/** 화면에 보이는 결과(Activity 박스·page 순서·canonical 응답·status) */
const visible = (state: RunState) => ({
  status: state.status,
  lastSeq: state.lastSeq,
  activities: selectActivities(state).map(
    ({ activityId, kind, phase, closedByRun, message }) => ({
      activityId,
      kind,
      phase,
      closedByRun,
      message,
    }),
  ),
  pages: selectPageBoundaries(state),
  response: selectResponse(state),
});

const expectSameAsCleanStream = (
  state: RunState,
  mock: ReturnType<typeof setup>["mock"],
) => {
  const run = mock.getRun(state.runId!)!;
  expect(visible(state)).toEqual(visible(reduceFrames(run.frames)));
};

const requestsOf = (
  mock: ReturnType<typeof setup>["mock"],
  method: string,
  pathPart: string,
) =>
  mock
    .getRequests()
    .filter(
      (entry) => entry.method === method && entry.path.includes(pathPart),
    );

describe("전송", () => {
  it("POST SSE frame을 reducer에 넣어 terminal까지 반영하고 run.created의 noteId를 세션 Note로 삼는다", async () => {
    const { mock, create } = setup();
    const session = create();
    const result = session.send(QUESTION);
    expect(result.ok).toBe(true);
    expect(session.getSnapshot()).toMatchObject({
      canSend: false,
      draft: QUESTION,
      origin: "send",
    });

    const done = await waitFor(session, isTerminal, "terminal");
    expect(done.run.status).toBe("COMPLETED");
    expect(done.noteId).toBe("9001");
    expect(done.draft).toBeNull();
    expect(done.canSend).toBe(true);
    expectSameAsCleanStream(done.run, mock);
    expect(requestsOf(mock, "POST", "/api/conversations")).toHaveLength(1);
    expect(requestsOf(mock, "GET", "/events")).toHaveLength(0);
  });

  it("다음 전송은 같은 Note로 보내고 새 run을 처음부터 그린다", async () => {
    const { mock, create } = setup();
    const session = create({ noteId: "42" });
    session.send(QUESTION);
    const first = await waitFor(session, isTerminal);
    session.send({ text: "다른 방법으로도 풀어줘" });
    const second = await waitFor(
      session,
      (snapshot) =>
        isTerminal(snapshot) && snapshot.run.runId !== first.run.runId,
    );
    expect(mock.getRun(second.run.runId!)!.noteId).toBe("42");
    expectSameAsCleanStream(second.run, mock);
  });

  it("Active Run 동안은 보내지 않는다(busy)", async () => {
    const { create } = setup({ template: "canceled-running" });
    const session = create();
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.lastSeq === 5);
    expect(session.getSnapshot().canSend).toBe(false);
    expect(session.send({ text: "또" })).toEqual({ ok: false, reason: "busy" });
  });

  it("계약에 맞지 않는 입력은 보내지 않고 draft와 invalid_request로 남긴다", () => {
    const { mock, create } = setup();
    const session = create();
    const result = session.send({ text: "   " });
    expect(result).toMatchObject({
      ok: false,
      reason: "invalid",
      code: "RUN4001",
    });
    expect(session.getSnapshot()).toMatchObject({
      draft: { text: "   " },
      problem: { kind: "invalid_request", code: "RUN4001" },
      connection: "idle",
    });
    expect(mock.getRequests()).toHaveLength(0);
  });

  it("run.created 전에 끊기면 같은 requestId로 다시 POST하고 run은 하나다", async () => {
    const { mock, create, delays } = setup();
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 0 });
    mock.injectFault("conversation", { kind: "error", status: 503 });
    const session = create();
    const result = session.send(QUESTION);
    const done = await waitFor(session, isTerminal);

    const posts = requestsOf(mock, "POST", "/api/conversations");
    expect(posts).toHaveLength(3);
    expect(new Set(posts.map((entry) => entry.requestId))).toEqual(
      new Set([result.ok && result.requestId]),
    );
    expect(mock.listRunIds()).toHaveLength(1);
    expect(delays).toEqual([750, 1_500]); // 진행 없음 → 지연 증가
    expectSameAsCleanStream(done.run, mock);
  });
});

describe("terminal 없는 단절 → backoff 재접속", () => {
  it.each(["eof", "network"] as const)(
    "중간 단절(%s) 뒤 마지막 처리 frame id로 GET /events에 붙어 같은 Activity·page 순서로 중복 없이 끝난다",
    async (mode) => {
      const { mock, create, delays } = setup();
      mock.injectFault("conversation", {
        kind: "disconnect",
        afterFrames: 5,
        mode,
      });
      mock.injectFault("events", { kind: "disconnect", afterFrames: 4, mode });
      const session = create();
      session.send(QUESTION);
      const done = await waitFor(session, isTerminal);

      const runId = done.run.runId!;
      expect(
        requestsOf(mock, "GET", "/events").map((e) => e.lastEventId),
      ).toEqual([`${runId}:5`, `${runId}:9`]);
      // 매번 새 frame이 들어왔으므로 횟수는 처음부터 센다(첫 재시도 지연).
      expect(delays).toEqual([750, 750]);
      expectSameAsCleanStream(done.run, mock);
      expect(done.run.activityOrder).toEqual(
        reduceFrames(mock.getRun(runId)!.frames).activityOrder,
      );
      // 단절은 취소가 아니다.
      expect(requestsOf(mock, "POST", "/cancel")).toHaveLength(0);
    },
  );

  it("중복 frame·겹친 replay가 와도 Activity·page가 한 번씩이다", async () => {
    const { mock, create } = setup();
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 6 });
    mock.injectFault("events", { kind: "ignore-cursor" }); // seq 1부터 다시
    const session = create();
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.lastSeq >= 6);

    // 다음 연결은 frame마다 두 번 보낸다.
    mock.injectFault("events", { kind: "duplicate" });
    const done = await waitFor(session, isTerminal);
    expectSameAsCleanStream(done.run, mock);
    const ids = selectActivities(done.run).map(
      (activity) => activity.activityId,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("같은 seq에서 서버 오류가 반복되면 지연이 늘어나고, 새 frame을 받으면 처음부터 센다", async () => {
    const { mock, create, delays } = setup();
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 3 });
    for (let i = 0; i < 6; i += 1)
      mock.injectFault("events", { kind: "error" });
    mock.injectFault("events", { kind: "disconnect", afterFrames: 2 });
    mock.injectFault("events", { kind: "error" });
    const session = create();
    session.send(QUESTION);
    const done = await waitFor(session, isTerminal);

    // equal jitter(random 0.5): base × 0.75. 1s·2s·4s·8s·16s·30s·30s → 진행 → 1s·2s
    expect(delays).toEqual([
      750, 1_500, 3_000, 6_000, 12_000, 22_500, 22_500, 750, 1_500,
    ]);
    const cursors = requestsOf(mock, "GET", "/events").map(
      (e) => e.lastEventId,
    );
    expect(new Set(cursors.slice(0, 7))).toEqual(
      new Set([`${done.run.runId}:3`]),
    );
    expectSameAsCleanStream(done.run, mock);
  });

  it("진행 없이 상한을 넘으면 멈추고 알리며, reconnect()로 다시 시도한다", async () => {
    const { mock, create, delays } = setup();
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 2 });
    for (let i = 0; i <= RECONNECT_BACKOFF.maxAttempts; i += 1)
      mock.injectFault("events", { kind: "error" });
    const session = create();
    session.send(QUESTION);
    const stopped = await waitFor(
      session,
      (snapshot) => snapshot.connection === "stopped",
    );
    expect(stopped.problem).toEqual({
      kind: "reconnect_exhausted",
      attempts: RECONNECT_BACKOFF.maxAttempts,
    });
    expect(delays).toHaveLength(RECONNECT_BACKOFF.maxAttempts);
    expect(stopped.canSend).toBe(false); // run은 아직 진행 중일 수 있다
    expect(requestsOf(mock, "POST", "/cancel")).toHaveLength(0);

    expect(session.reconnect()).toBe(true);
    const done = await waitFor(session, isTerminal);
    expectSameAsCleanStream(done.run, mock);
  });

  it("재접속이 404 RUN4041이면 멈추고 not_found(events)로 알린다(더 요청하지 않음)", async () => {
    const { mock, create } = setup({ template: "canceled-running" });
    const session = create({ noteId: "5" });
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.lastSeq === 5);
    mock.deleteNote("5"); // 열린 연결은 frame 없이 닫힌다 → 재접속 → 404
    const stopped = await waitFor(
      session,
      (snapshot) => snapshot.connection === "stopped",
    );
    expect(stopped.problem).toEqual({ kind: "not_found", during: "events" });
    expect(stopped.canCancel).toBe(false);
    const count = mock.getRequests().length;
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mock.getRequests()).toHaveLength(count);
    expect(requestsOf(mock, "GET", "/events").at(-1)?.status).toBe(404);
  });

  it("401(갱신 실패)이면 재접속하지 않고 로그인 흐름으로 보낸다", async () => {
    const { mock, create, onUnauthorized } = setup({
      template: "canceled-running",
    });
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 5 });
    server.use(
      http.get(`${BASE_URL}/api/ai-runs/:runId/events`, () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: "AUTH4012",
            message: "토큰이 만료되었습니다.",
          },
          { status: 401 },
        ),
      ),
    );
    const session = create();
    session.send(QUESTION);
    const stopped = await waitFor(
      session,
      (snapshot) => snapshot.connection === "stopped",
    );
    expect(stopped.problem).toEqual({ kind: "unauthorized" });
    expect(stopped.run.lastSeq).toBe(5);
    expect(stopped.canSend).toBe(false);
    expect(stopped.canCancel).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

describe("409 RUN4091 — 진행 중 run에 붙기", () => {
  it("activeRunId에 cursor 없이 붙어 처음부터 받고 보낸 입력은 draft로 남긴다(자동 재전송 없음)", async () => {
    const { mock, create } = setup();
    const activeRunId = mock.seedRun({ noteId: "5", committed: 6 });
    const session = create({ noteId: "5" });
    session.send(QUESTION);

    const attached = await waitFor(
      session,
      (snapshot) => snapshot.run.lastSeq === 6,
    );
    expect(attached).toMatchObject({
      origin: "active_run_conflict",
      draft: QUESTION,
      problem: null,
      canSend: false,
      canCancel: true,
    });
    expect(attached.run.runId).toBe(activeRunId);
    expect(requestsOf(mock, "GET", "/events")[0].lastEventId).toBeNull();
    expect(selectActivities(attached.run).map((a) => a.activityId)).toEqual(
      selectActivities(
        reduceFrames(mock.getRun(activeRunId)!.frames.slice(0, 6)),
      ).map((a) => a.activityId),
    );

    mock.commit(activeRunId);
    const done = await waitFor(session, isTerminal);
    expectSameAsCleanStream(done.run, mock);
    expect(done.draft).toEqual(QUESTION);
    expect(done.canSend).toBe(true);
    expect(requestsOf(mock, "POST", "/api/conversations")).toHaveLength(1);
  });
});

describe("Note 진입·새로고침 복원", () => {
  it("대화 조회 activeRun이 있으면 seq 1부터 받아 Activity까지 복원하고 이어 받는다", async () => {
    const { mock, create } = setup();
    const runId = mock.seedRun({ noteId: "5", committed: 7 });
    const session = create({ noteId: "5" });
    const page = await session.restore();
    expect(page?.activeRun).toEqual({ runId, status: "RUNNING", lastSeq: 7 });

    const restored = await waitFor(
      session,
      (snapshot) =>
        snapshot.run.lastSeq === 7 && snapshot.connection === "streaming",
    );
    expect(restored.origin).toBe("restore");
    expect(requestsOf(mock, "GET", "/events")[0].lastEventId).toBeNull();
    expect(visible(restored.run).activities).toEqual(
      visible(reduceFrames(mock.getRun(runId)!.frames.slice(0, 7))).activities,
    );

    mock.commit(runId);
    const done = await waitFor(session, isTerminal);
    expectSameAsCleanStream(done.run, mock);
  });

  it("새로고침(새 세션)도 같은 결과다 — 이전 탭 세션 dispose는 run을 취소하지 않는다", async () => {
    const { mock, create } = setup({ template: "canceled-running" });
    const before = create({ noteId: "5" });
    before.send(QUESTION);
    await waitFor(before, (snapshot) => snapshot.run.lastSeq === 5);
    const runId = before.getSnapshot().run.runId!;
    before.dispose();
    expect(before.getSnapshot().connection).toBe("idle");
    await vi.waitFor(() => expect(mock.getOpenConnections()).toBe(0));
    expect(mock.getRun(runId)!.status).toBe("RUNNING");
    expect(requestsOf(mock, "POST", "/cancel")).toHaveLength(0);

    const after = create({ noteId: "5" });
    await after.restore();
    const restored = await waitFor(
      after,
      (snapshot) => snapshot.run.lastSeq === 5,
    );
    expect(visible(restored.run)).toEqual(visible(before.getSnapshot().run));
  });

  it("activeRun이 없으면 연결하지 않는다", async () => {
    const { mock, create } = setup();
    mock.seedRun({ noteId: "5" }); // 끝난 run
    const session = create({ noteId: "5" });
    const page = await session.restore();
    expect(page?.messages).toHaveLength(2);
    expect(session.getSnapshot()).toMatchObject({
      connection: "idle",
      canSend: true,
    });
    expect(requestsOf(mock, "GET", "/events")).toHaveLength(0);
  });

  it("대화 조회 실패는 restore_failed", async () => {
    const { mock, create } = setup();
    mock.deleteNote("5");
    const session = create({ noteId: "5" });
    expect(await session.restore()).toBeNull();
    expect(session.getSnapshot().problem?.kind).toBe("restore_failed");
  });
});

describe("정지", () => {
  it("POST /cancel만 쓰고, CANCELING 동안 전송을 막고, 취소 후 완료 Activity가 남고 자동 전송이 없다", async () => {
    const { mock, create } = setup({
      template: "canceled-running",
      holdCancelConfirmation: true,
    });
    const session = create();
    session.send(QUESTION);
    const running = await waitFor(
      session,
      (snapshot) => snapshot.run.lastSeq === 5,
    );
    expect(running.canCancel).toBe(true);

    const cancelling = session.cancel();
    expect(session.getSnapshot()).toMatchObject({
      cancel: { phase: "requesting" },
      canCancel: false,
      canSend: false,
    });
    expect(await cancelling).toMatchObject({
      status: "CANCELING",
      outcome: "accepted",
    });

    const canceling = await waitFor(
      session,
      (snapshot) => snapshot.run.status === "CANCELING",
    );
    expect(canceling).toMatchObject({
      cancel: { phase: "done", outcome: "accepted", status: "CANCELING" },
      canSend: false,
      canCancel: false,
    });
    expect(session.send(QUESTION)).toEqual({ ok: false, reason: "busy" });

    mock.commit(session.getSnapshot().run.runId!); // Server가 CANCELED 확정
    const done = await waitFor(session, isTerminal);
    expect(done.run.status).toBe("CANCELED");
    expect(done.run.cancel).toEqual({
      cause: "user_requested",
      message: "답변 생성을 중단했습니다.",
    });
    const activities = selectActivities(done.run);
    expect(activities.map((a) => [a.activityId, a.phase])).toEqual([
      ["activity-1", "completed"],
      ["activity-8", "canceled"],
    ]);
    expect(done.canSend).toBe(true);
    expect(done.draft).toBeNull();

    // terminal 뒤 자동 재전송 없음
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestsOf(mock, "POST", "/api/conversations")).toHaveLength(1);
    expect(requestsOf(mock, "POST", "/cancel")).toHaveLength(1);
  });

  it("PENDING 취소는 accepted·CANCELED이고 stream의 run.canceled로 끝난다", async () => {
    const { create } = setup({ template: "canceled-pending" });
    const session = create();
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.status === "PENDING");
    expect(await session.cancel()).toMatchObject({
      status: "CANCELED",
      outcome: "accepted",
    });
    const done = await waitFor(session, isTerminal);
    expect(done.run.status).toBe("CANCELED");
  });

  it("다른 탭이 이미 정지했으면 already_canceling, 이미 끝났으면 already_terminal", async () => {
    const { mock, create } = setup({
      template: "canceled-running",
      holdCancelConfirmation: true,
    });
    const tabA = create({ noteId: "5" });
    tabA.send(QUESTION);
    await waitFor(tabA, (snapshot) => snapshot.run.lastSeq === 5);
    const runId = tabA.getSnapshot().run.runId!;

    const tabB = create({ noteId: "5" });
    await tabB.restore();
    await waitFor(tabB, (snapshot) => snapshot.run.lastSeq === 5);
    tabB.dispose(); // B는 연결만 끊고 상태는 RUNNING으로 들고 있다

    await tabA.cancel();
    expect(await tabB.cancel()).toMatchObject({ outcome: "already_canceling" });
    expect(tabB.getSnapshot().cancel).toEqual({
      phase: "done",
      outcome: "already_canceling",
      status: "CANCELING",
    });

    mock.commit(runId);
    await waitFor(tabA, isTerminal);
    const tabC = create({ noteId: "5" });
    await tabC.restore({
      noteId: "5",
      activeRun: { runId, status: "RUNNING", lastSeq: 5 },
      messages: [],
      nextBefore: null,
    });
    tabC.dispose();
    expect(await tabC.cancel()).toMatchObject({
      outcome: "already_terminal",
      status: "CANCELED",
    });
  });

  it("runId를 모르면(run.created 전) 정지할 수 없다", () => {
    const { create } = setup();
    const session = create();
    session.send(QUESTION);
    expect(session.getSnapshot().canCancel).toBe(false);
  });

  it("정지 요청 실패는 failed로 두고 다시 누를 수 있다", async () => {
    const { create } = setup({ template: "canceled-running" });
    const session = create();
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.lastSeq === 5);
    server.use(
      http.post(`${BASE_URL}/api/ai-runs/:runId/cancel`, () =>
        HttpResponse.error(),
      ),
    );
    expect(await session.cancel()).toBeNull();
    expect(session.getSnapshot()).toMatchObject({
      cancel: { phase: "failed" },
      canCancel: true,
    });
  });
});

describe("접수 거부", () => {
  it("RUN4291은 Retry-After를 typed 상태로 주고 draft를 남기며 다시 보내지 않는다", async () => {
    const { mock, create } = setup();
    mock.rejectNextConversation({ code: "RUN4291", retryAfterSeconds: 30 });
    const session = create({ noteId: "5" });
    session.send(QUESTION);
    const rejected = await waitFor(
      session,
      (snapshot) => snapshot.problem !== null,
    );
    expect(rejected).toMatchObject({
      connection: "idle",
      draft: QUESTION,
      canSend: true,
      problem: {
        kind: "rejected",
        detail: { code: "RUN4291", status: 429, retryAfterSeconds: 30 },
        retryAt: 1_000_000 + 30_000,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestsOf(mock, "POST", "/api/conversations")).toHaveLength(1);
  });

  it.each([
    ["RUN4021", 402],
    ["RUN4221", 422],
    ["RUN4092", 409],
  ] as const)(
    "%s(HTTP %i)는 rejected로 노출하고 재시도하지 않는다",
    async (code, status) => {
      const { mock, create } = setup();
      mock.rejectNextConversation({ code });
      const session = create({ noteId: "5" });
      session.send(QUESTION);
      const rejected = await waitFor(
        session,
        (snapshot) => snapshot.problem !== null,
      );
      expect(rejected.problem).toEqual({
        kind: "rejected",
        detail: { code, status, message: expect.any(String) },
        retryAt: null,
      });
      expect(rejected.draft).toEqual(QUESTION);
      expect(requestsOf(mock, "POST", "/api/conversations")).toHaveLength(1);
      // Front는 차감하지 않는다: run·사용량 경로 밖 요청이 없다.
      expect(
        mock.getRequests().every((entry) => entry.path.startsWith("/api/")),
      ).toBe(true);

      session.clearDraft();
      expect(session.getSnapshot()).toMatchObject({
        draft: null,
        problem: null,
      });
    },
  );
});

describe("리뷰 1회차 회귀", () => {
  const runningSession = async (
    ctx: ReturnType<typeof setup>,
    options: RunSessionOptions = {},
  ) => {
    const session = ctx.create({ noteId: "5", ...options });
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.lastSeq === 5);
    return { session, runId: session.getSnapshot().run.runId! };
  };

  it("B1: 이탈 중 끝난 run은 돌아와 restore하면 대화 조회의 terminal message로 끝나고 전송할 수 있다", async () => {
    const ctx = setup({ template: "canceled-running" });
    const { session, runId } = await runningSession(ctx);
    session.dispose();
    await api.cancelRun(runId); // 다른 탭에서 정지 → Server에서 CANCELED
    expect(ctx.mock.getRun(runId)!.status).toBe("CANCELED");
    expect(session.getSnapshot()).toMatchObject({
      run: { status: "RUNNING" },
      canSend: false,
    });

    const page = await session.restore();
    expect(page?.activeRun).toBeNull();
    expect(session.getSnapshot()).toMatchObject({
      connection: "idle",
      run: { status: "CANCELED" },
      canSend: true,
      canCancel: false,
    });
    // 완료됐던 Activity는 남는다.
    expect(selectActivities(session.getSnapshot().run)[0]).toMatchObject({
      activityId: "activity-1",
      phase: "completed",
    });
    expect(requestsOf(ctx.mock, "GET", "/events")).toHaveLength(0);
  });

  it("B1: 대화 조회 페이지에 그 run message가 없으면 cursor로 붙어 terminal replay를 받는다", async () => {
    const ctx = setup({ template: "canceled-running" });
    const { session, runId } = await runningSession(ctx);
    session.dispose();
    await api.cancelRun(runId);
    await session.restore({
      noteId: "5",
      activeRun: null,
      messages: [],
      nextBefore: null,
    });
    const done = await waitFor(session, isTerminal);
    expect(done.run.status).toBe("CANCELED");
    expect(
      requestsOf(ctx.mock, "GET", "/events").map((e) => e.lastEventId),
    ).toEqual([`${runId}:5`]);
    expectSameAsCleanStream(done.run, ctx.mock);
  });

  it("R1: 이미 terminal을 받은 run을 가리키는 오래된 page로 restore해도 연결하지 않는다", async () => {
    const ctx = setup();
    const session = ctx.create({ noteId: "5" });
    session.send(QUESTION);
    const done = await waitFor(session, isTerminal);
    await session.restore({
      noteId: "5",
      activeRun: { runId: done.run.runId!, status: "RUNNING", lastSeq: 3 },
      messages: [],
      nextBefore: null,
    });
    expect(session.getSnapshot()).toMatchObject({
      connection: "idle",
      reconnect: null,
      canSend: true,
    });
    expect(ctx.delays).toEqual([]);
    expect(requestsOf(ctx.mock, "GET", "/events")).toHaveLength(0);
  });

  it("R3: 재시도 소진으로 stream이 없을 때 정지가 받아들여지면 한 번 다시 붙어 terminal을 받는다", async () => {
    const ctx = setup({ template: "canceled-running" });
    ctx.mock.injectFault("conversation", {
      kind: "disconnect",
      afterFrames: 5,
    });
    for (let i = 0; i <= RECONNECT_BACKOFF.maxAttempts; i += 1)
      ctx.mock.injectFault("events", { kind: "error" });
    const session = ctx.create();
    session.send(QUESTION);
    await waitFor(
      session,
      (snapshot) => snapshot.problem?.kind === "reconnect_exhausted",
    );
    expect(await session.cancel()).toMatchObject({ outcome: "accepted" });
    const done = await waitFor(session, isTerminal);
    expect(done).toMatchObject({
      run: { status: "CANCELED" },
      problem: null,
      canSend: true,
    });
    expect(requestsOf(ctx.mock, "POST", "/api/conversations")).toHaveLength(1);
  });

  it("R3: dispose 뒤 끝난 정지 요청은 다시 붙지 않는다", async () => {
    const ctx = setup({ template: "canceled-running" });
    const { session } = await runningSession(ctx);
    const canceling = session.cancel();
    session.dispose();
    expect(await canceling).toMatchObject({ outcome: "accepted" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestsOf(ctx.mock, "GET", "/events")).toHaveLength(0);
    expect(session.getSnapshot().connection).toBe("idle");
  });

  it("R2: 재접속의 그 밖 거부는 stream_rejected로 멈추고 clearDraft가 지우지 않으며 reconnect()로 회복한다", async () => {
    const ctx = setup();
    ctx.mock.injectFault("conversation", {
      kind: "disconnect",
      afterFrames: 4,
    });
    server.use(
      http.get(
        `${BASE_URL}/api/ai-runs/:runId/events`,
        () =>
          HttpResponse.json(
            { isSuccess: false, code: "COMMON403", message: "금지" },
            { status: 403 },
          ),
        { once: true },
      ),
    );
    const session = ctx.create();
    session.send(QUESTION);
    const stopped = await waitFor(
      session,
      (snapshot) => snapshot.connection === "stopped",
    );
    expect(stopped.problem).toMatchObject({
      kind: "stream_rejected",
      detail: { code: null, status: 403 },
    });
    session.clearDraft();
    expect(session.getSnapshot().problem?.kind).toBe("stream_rejected");
    expect(session.reconnect()).toBe(true);
    const done = await waitFor(session, isTerminal);
    expectSameAsCleanStream(done.run, ctx.mock);
  });

  it("R5: 전송의 404 RUN4041(Note 삭제)도 not_found이고 draft를 남긴다", async () => {
    const ctx = setup();
    ctx.mock.deleteNote("5");
    const session = ctx.create({ noteId: "5" });
    session.send(QUESTION);
    const rejected = await waitFor(
      session,
      (snapshot) => snapshot.problem !== null,
    );
    expect(rejected).toMatchObject({
      connection: "idle",
      problem: { kind: "not_found", during: "send" },
      draft: QUESTION,
    });
  });

  it("R6: mock reset은 열린 SSE 연결을 닫는다", async () => {
    const ctx = setup({ template: "canceled-running" });
    const { session } = await runningSession(ctx);
    expect(ctx.mock.getOpenConnections()).toBe(1);
    ctx.mock.reset();
    expect(ctx.mock.getOpenConnections()).toBe(0);
    // 끊긴 연결은 재접속을 시도하고(reset된 server에는 run이 없어 404) 멈춘다.
    const stopped = await waitFor(
      session,
      (snapshot) => snapshot.connection === "stopped",
    );
    expect(stopped.problem).toEqual({ kind: "not_found", during: "events" });
  });
});

describe("화면 이탈·Note 전환", () => {
  it("dispose는 연결만 끊고 run을 취소하지 않으며 이후 재접속하지 않는다", async () => {
    const { mock, create } = setup({ template: "canceled-running" });
    const session = create({ noteId: "5" });
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.run.lastSeq === 5);
    const runId = session.getSnapshot().run.runId!;
    session.dispose();
    await vi.waitFor(() => expect(mock.getOpenConnections()).toBe(0));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestsOf(mock, "GET", "/events")).toHaveLength(0);
    expect(requestsOf(mock, "POST", "/cancel")).toHaveLength(0);
    expect(mock.getRun(runId)!.status).toBe("RUNNING");

    // 다른 Note 세션은 독립이다.
    mock.useTemplateForNextRun("substantive-completed");
    const other = create({ noteId: "6" });
    other.send(QUESTION);
    const done = await waitFor(other, isTerminal);
    expect(mock.getRun(done.run.runId!)!.noteId).toBe("6");
    expect(mock.getRun(runId)!.status).toBe("RUNNING");
  });

  it("backoff 대기 중 dispose하면 재접속하지 않는다", async () => {
    const { mock, create } = setup();
    mock.injectFault("conversation", { kind: "disconnect", afterFrames: 3 });
    const session = create({
      timers: { setTimeout: () => 0, clearTimeout: () => {} }, // 대기가 끝나지 않는다
    });
    session.send(QUESTION);
    await waitFor(session, (snapshot) => snapshot.connection === "backoff");
    session.dispose();
    expect(session.getSnapshot().connection).toBe("idle");
    expect(requestsOf(mock, "GET", "/events")).toHaveLength(0);
  });
});
