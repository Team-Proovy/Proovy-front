import { http, HttpResponse } from "msw";
import {
  CANCEL_MESSAGES,
  HEARTBEAT_COMMENT,
  isTerminalFrame,
  RUN_ERROR_MESSAGES,
  SUCCESS_CODE,
  SUCCESS_MESSAGE,
  toEventId,
} from "@/shared/contracts/browser_run_v1";
import type {
  ActiveRunStatus,
  AssistantMessageContent,
  BrowserFrame,
  ConversationMessage,
  ConversationMessageStatus,
  ConversationPage,
  ConversationRunRequest,
  NoteId,
  PublicRunStatus,
  RunCancelResult,
  RunCreatedFrame,
  RunErrorCode,
  RunStatus,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import { createRequestId, validateConversationRequest } from "../../api";
import { getStreamTemplate } from "./browser_run_stream_templates";
import type { StreamTemplateName } from "./browser_run_stream_templates";

/**
 * browser-run-v1 fixture 기반 in-memory run Server + MSW handler (테스트·fixture 모드 공용).
 *
 * - run 하나 = `streams/valid` fixture 하나(template)의 frame. ID(runId·requestId·message id)는 run마다 새로 만들고
 *   `run.created.noteId`는 요청 Note(없으면 새 Note)로 바꾼다. 나머지 payload는 fixture 그대로다.
 * - frame은 "commit된 것"만 stream에 나간다. 기본은 취소 분기 앞까지 즉시 commit하고, `frameIntervalMs`를 주면
 *   그 간격으로 하나씩 commit한다(fixture 모드에서 진행이 보이게). 테스트는 `commit()`으로 직접 진행시킨다.
 * - 취소: template에 user_requested 취소 분기(`canceled-running`·`canceled-pending`)가 있으면 그 앞에서 멈춰 있다가
 *   cancel 요청에서 분기를 commit한다. 분기가 없는 template은 `run.canceling`·열린 Activity `activity.canceled`·
 *   `run.canceled`를 cancel 시점 뒤에 붙인다.
 * - 접수: 형식(RUN4001·RUN4002) → 같은 requestId(replay·RUN4092) → Note 삭제(RUN4041) → 예약 거부 → Active Run(RUN4091) → 접수.
 * - 장애 주입(`injectFault`)은 다음 연결 하나에 쓰인다: 중간 단절·stream 전 5xx·frame 중복·cursor 무시(겹친 replay).
 */

export type MockConnectionKind = "conversation" | "events";

export type MockConnectionFault =
  /** `afterFrames`개를 보낸 뒤 terminal 없이 끊는다. `eof`(서버가 닫음, 기본)·`network`(읽기 오류) */
  | { kind: "disconnect"; afterFrames: number; mode?: "eof" | "network" }
  /** stream 전 계약 밖 오류 JSON(기본 500 COMMON500) */
  | { kind: "error"; status?: number }
  /** frame마다 같은 frame을 한 번 더 보낸다(같은 event id 재전달) */
  | { kind: "duplicate" }
  /** cursor를 무시하고 seq 1부터 다시 보낸다(겹친 replay) */
  | { kind: "ignore-cursor" };

export interface MockAdmissionRejection {
  code: Exclude<RunErrorCode, "RUN4091">;
  /** RUN4291 `Retry-After` header(초) */
  retryAfterSeconds?: number;
}

export interface MockRunSeed {
  template?: StreamTemplateName;
  noteId: NoteId;
  /** 처음 commit할 frame 수. 기본: 취소 분기 앞까지(없으면 전부) */
  committed?: number;
  text?: string;
}

export interface MockRequestLog {
  method: string;
  path: string;
  /** GET /events의 cursor(`Last-Event-ID` header 또는 query) */
  lastEventId: string | null;
  /** POST /api/conversations의 requestId */
  requestId: Uuid | null;
  /** 처리 결과 HTTP status */
  status: number;
}

export interface BrowserRunMockServerOptions {
  /** handler URL 접두사. 기본 `*`(어느 origin이든 `/api/...`) */
  baseUrl?: string;
  /** 새 run의 template. 기본 `substantive-completed` */
  template?: StreamTemplateName;
  /** 주면 run.created 뒤 frame을 이 간격(ms)으로 하나씩 commit한다. 없으면 즉시 */
  frameIntervalMs?: number;
  /** 주면 이 간격으로 대기 중인 연결에 heartbeat comment를 보낸다 */
  heartbeatMs?: number;
  /**
   * true면 RUNNING 취소에서 `run.canceled` 앞(CANCELING)까지만 commit하고 확정은 `commit()`을 기다린다
   * (Server의 Brain 정리 확인 대기). 기본 false = 바로 확정.
   */
  holdCancelConfirmation?: boolean;
}

interface MockRun {
  runId: Uuid;
  requestId: Uuid;
  noteId: NoteId;
  userMessageId: Uuid;
  assistantMessageId: Uuid;
  /** 같은 requestId 재전송 비교용 원문 */
  requestKey: string;
  request: ConversationRunRequest | null;
  frames: BrowserFrame[];
  committed: number;
  /** user_requested 취소 분기의 시작 index. 없으면 null */
  cancelBranch: number | null;
  createdAt: string;
  waiters: Set<() => void>;
  pacing: ReturnType<typeof setTimeout> | null;
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream;charset=UTF-8",
  "Cache-Control": "no-cache",
};

const errorResponse = (
  status: number,
  code: RunErrorCode,
  extra: { result?: unknown; headers?: Record<string, string> } = {},
) =>
  HttpResponse.json(
    {
      isSuccess: false,
      code,
      message: RUN_ERROR_MESSAGES[code],
      ...(extra.result !== undefined && { result: extra.result }),
    },
    { status, headers: extra.headers },
  );

const ERROR_STATUS: Record<RunErrorCode, number> = {
  AUTH4010: 401,
  AUTH4012: 401,
  AUTH4013: 401,
  RUN4001: 400,
  RUN4002: 400,
  RUN4003: 400,
  RUN4004: 400,
  RUN4021: 402,
  RUN4041: 404,
  RUN4091: 409,
  RUN4092: 409,
  RUN4221: 422,
  RUN4291: 429,
};

const successResponse = <T>(result: T) =>
  HttpResponse.json({
    isSuccess: true,
    code: SUCCESS_CODE,
    message: SUCCESS_MESSAGE,
    result,
  });

const encodeFrame = (frame: BrowserFrame) =>
  `event: ${frame.type}\nid: ${toEventId(frame.runId, frame.seq)}\ndata: ${JSON.stringify(frame)}\n\n`;

const ACTIVITY_END_TYPES = new Set([
  "activity.completed",
  "activity.failed",
  "activity.canceled",
]);

/** user_requested 취소 분기의 시작(run.canceling, 없으면 run.canceled) */
const findCancelBranch = (frames: BrowserFrame[]) => {
  const canceled = frames.find((frame) => frame.type === "run.canceled");
  if (canceled?.type !== "run.canceled") return null;
  if (canceled.payload.cause !== "user_requested") return null;
  const index = frames.findIndex(
    (frame) => frame.type === "run.canceling" || frame.type === "run.canceled",
  );
  return index < 0 ? null : index;
};

export const createBrowserRunMockServer = ({
  baseUrl = "*",
  template: defaultTemplate = "substantive-completed",
  frameIntervalMs,
  heartbeatMs,
  holdCancelConfirmation = false,
}: BrowserRunMockServerOptions = {}) => {
  const runs = new Map<Uuid, MockRun>();
  const deletedNotes = new Set<NoteId>();
  const faults: Record<MockConnectionKind, MockConnectionFault[]> = {
    conversation: [],
    events: [],
  };
  const admissionRejections: MockAdmissionRejection[] = [];
  const templateQueue: StreamTemplateName[] = [];
  const requests: MockRequestLog[] = [];
  let nextNoteId = 9001;
  let openConnections = 0;

  const log = (entry: MockRequestLog) => {
    requests.push(entry);
  };

  // -------------------------------------------------------------------------
  // run 상태
  // -------------------------------------------------------------------------

  const committedFrames = (run: MockRun) => run.frames.slice(0, run.committed);

  const statusOf = (run: MockRun): PublicRunStatus => {
    const frames = committedFrames(run);
    const last = frames.at(-1);
    if (last?.type === "run.completed") return "COMPLETED";
    if (last?.type === "run.failed") return "FAILED";
    if (last?.type === "run.canceled") return "CANCELED";
    if (frames.some((frame) => frame.type === "run.canceling"))
      return "CANCELING";
    return frames.length <= 1 ? "PENDING" : "RUNNING";
  };

  const isRunActive = (run: MockRun) =>
    !["COMPLETED", "FAILED", "CANCELED"].includes(statusOf(run));

  const notify = (run: MockRun) => {
    for (const wake of [...run.waiters]) wake();
  };

  /** frame을 `count`개 더 commit한다(기본: 취소 분기 앞까지, 분기가 없으면 끝까지). */
  const commit = (runId: Uuid, count?: number) => {
    const run = runs.get(runId);
    if (!run) throw new Error(`mock run 없음: ${runId}`);
    const limit =
      run.cancelBranch !== null && run.committed <= run.cancelBranch
        ? run.cancelBranch
        : run.frames.length;
    run.committed =
      count === undefined
        ? Math.max(run.committed, limit)
        : Math.min(run.frames.length, run.committed + count);
    notify(run);
  };

  const schedulePacing = (run: MockRun) => {
    if (frameIntervalMs === undefined) return;
    const limit = () =>
      run.cancelBranch !== null && run.committed <= run.cancelBranch
        ? run.cancelBranch
        : run.frames.length;
    const step = () => {
      run.pacing = null;
      if (run.committed >= limit()) return;
      run.committed += 1;
      notify(run);
      run.pacing = setTimeout(step, frameIntervalMs);
    };
    run.pacing = setTimeout(step, frameIntervalMs);
  };

  const createRun = ({
    templateName,
    noteId,
    request,
    requestKey,
    committed,
  }: {
    templateName: StreamTemplateName;
    noteId: NoteId;
    request: ConversationRunRequest | null;
    requestKey: string;
    committed?: number;
  }) => {
    const template = getStreamTemplate(templateName);
    const created = template.frames[0] as RunCreatedFrame;
    const ids = {
      runId: createRequestId(),
      requestId: request?.requestId ?? createRequestId(),
      userMessageId: createRequestId(),
      assistantMessageId: createRequestId(),
    };
    const replacements: [string, string][] = [
      [template.runId, ids.runId],
      [created.payload.requestId, ids.requestId],
      [created.payload.userMessageId, ids.userMessageId],
      [created.payload.assistantMessageId, ids.assistantMessageId],
    ];
    let text = JSON.stringify(template.frames);
    for (const [from, to] of replacements) text = text.replaceAll(from, to);
    const frames = JSON.parse(text) as BrowserFrame[];
    (frames[0] as RunCreatedFrame).payload.noteId = noteId;

    const cancelBranch = findCancelBranch(frames);
    const run: MockRun = {
      ...ids,
      noteId,
      requestKey,
      request,
      frames,
      committed: 0,
      cancelBranch,
      createdAt: new Date().toISOString(),
      waiters: new Set(),
      pacing: null,
    };
    runs.set(run.runId, run);
    if (committed !== undefined)
      run.committed = Math.min(frames.length, committed);
    else if (frameIntervalMs !== undefined) {
      run.committed = 1;
      schedulePacing(run);
    } else run.committed = cancelBranch ?? frames.length;
    return run;
  };

  /** 취소 분기가 없는 template: commit된 지점 뒤로 취소 frame을 만들어 붙인다. */
  const appendCancelFrames = (run: MockRun, fromPending: boolean) => {
    const committed = committedFrames(run);
    let seq = committed.length;
    const occurredAt = new Date().toISOString();
    const frame = <T extends BrowserFrame>(
      type: T["type"],
      payload: T["payload"],
    ) =>
      ({
        contractVersion: "brain-source-v1",
        runId: run.runId,
        seq: ++seq,
        occurredAt,
        type,
        payload,
      }) as T;

    const appended: BrowserFrame[] = [];
    if (!fromPending) {
      appended.push(
        frame("run.canceling", {
          assistantMessageId: run.assistantMessageId,
          status: "CANCELING",
        }),
      );
      const open = new Map<string, Record<string, unknown>>();
      for (const item of committed) {
        if (!item.type.startsWith("activity.")) continue;
        const payload = item.payload as unknown as Record<string, unknown>;
        const activityId = payload.activityId as string;
        if (ACTIVITY_END_TYPES.has(item.type)) open.delete(activityId);
        else
          open.set(activityId, {
            ...open.get(activityId),
            kind: payload.kind,
            ...(typeof payload.methodLabel === "string" && {
              methodLabel: payload.methodLabel,
            }),
          });
      }
      for (const [activityId, info] of open)
        appended.push(
          frame("activity.canceled", {
            activityId,
            ...info,
          } as never),
        );
    }
    appended.push(
      frame("run.canceled", {
        assistantMessageId: run.assistantMessageId,
        status: "CANCELED",
        cause: "user_requested",
        message: CANCEL_MESSAGES.user_requested,
      }),
    );
    run.frames = [...committed, ...appended];
    run.cancelBranch = null;
    run.committed = run.frames.length;
  };

  const cancelRun = (run: MockRun): RunCancelResult => {
    const status = statusOf(run);
    if (status === "CANCELING")
      return { runId: run.runId, status, outcome: "already_canceling" };
    if (!isRunActive(run))
      return { runId: run.runId, status, outcome: "already_terminal" };
    if (run.pacing) clearTimeout(run.pacing);
    run.pacing = null;
    // 분기 바로 앞에서 멈춰 있으면 fixture 분기를 그대로 쓴다. 그보다 앞(진행 중 pacing)이면 만들어 붙인다.
    if (run.cancelBranch !== null && run.committed === run.cancelBranch) {
      run.cancelBranch = null;
      run.committed = run.frames.length;
    } else appendCancelFrames(run, status === "PENDING");
    if (holdCancelConfirmation && status === "RUNNING") run.committed -= 1;
    notify(run);
    // PENDING은 즉시 CANCELED, RUNNING은 CANCELING으로 받아들인다(확정은 stream의 run.canceled).
    return {
      runId: run.runId,
      status: status === "PENDING" ? "CANCELED" : "CANCELING",
      outcome: "accepted",
    };
  };

  // -------------------------------------------------------------------------
  // 조회 응답
  // -------------------------------------------------------------------------

  const assistantContent = (run: MockRun): AssistantMessageContent => {
    const empty: AssistantMessageContent = {
      responseDisposition: null,
      clarificationReason: null,
      assistantResponse: null,
      verificationSummary: [],
      failure: null,
      cancel: null,
    };
    const last = committedFrames(run).at(-1);
    if (last?.type === "run.completed")
      return {
        ...empty,
        responseDisposition: last.payload.responseDisposition,
        clarificationReason: last.payload.clarificationReason ?? null,
        assistantResponse: last.payload.assistantResponse,
        verificationSummary: last.payload.verificationSummary ?? [],
      };
    if (last?.type === "run.failed")
      return {
        ...empty,
        failure: {
          code: last.payload.code,
          reason: last.payload.reason ?? null,
          message: last.payload.message,
          recoverable: last.payload.recoverable,
        },
      };
    if (last?.type === "run.canceled")
      return {
        ...empty,
        cancel: { cause: last.payload.cause, message: last.payload.message },
      };
    return empty;
  };

  const MESSAGE_STATUS: Record<PublicRunStatus, ConversationMessageStatus> = {
    PENDING: "PENDING",
    RUNNING: "STREAMING",
    CANCELING: "STREAMING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELED: "CANCELED",
  };

  const conversationPage = (noteId: NoteId, limit = 50): ConversationPage => {
    const noteRuns = [...runs.values()].filter((run) => run.noteId === noteId);
    const messages: ConversationMessage[] = noteRuns.flatMap((run) => {
      const created = run.frames[0] as RunCreatedFrame;
      const assistantAt = new Date(
        Date.parse(run.createdAt) + 1000,
      ).toISOString();
      return [
        {
          messageId: run.userMessageId,
          role: "user",
          status: "COMPLETED",
          runId: run.runId,
          createdAt: run.createdAt,
          user: {
            text: run.request?.text ?? "fixture 질문",
            latex: run.request?.latex || null,
            requestedTasks: created.payload.requestedTasks,
            requestedOutputs: ["text"],
            turnAttachments: [],
            viewerFocus: run.request?.viewerFocus ?? null,
          },
        },
        {
          messageId: run.assistantMessageId,
          role: "assistant",
          status: MESSAGE_STATUS[statusOf(run)],
          runId: run.runId,
          createdAt: assistantAt,
          assistant: assistantContent(run),
        },
      ];
    });
    const active = noteRuns.find(isRunActive);
    return {
      noteId,
      activeRun: active
        ? {
            runId: active.runId,
            status: statusOf(active) as ActiveRunStatus,
            lastSeq: active.committed,
          }
        : null,
      messages: messages.slice(-limit),
      nextBefore: null,
    };
  };

  const runStatus = (run: MockRun): RunStatus => {
    const status = statusOf(run);
    const last = committedFrames(run).at(-1);
    const terminal = !isRunActive(run);
    return {
      runId: run.runId,
      requestId: run.requestId,
      noteId: run.noteId,
      userMessageId: run.userMessageId,
      assistantMessageId: run.assistantMessageId,
      status,
      cancelable: status === "PENDING" || status === "RUNNING",
      lastSeq: run.committed,
      responseDisposition:
        last?.type === "run.completed"
          ? last.payload.responseDisposition
          : null,
      failure:
        last?.type === "run.failed"
          ? {
              code: last.payload.code,
              reason: last.payload.reason ?? null,
              recoverable: last.payload.recoverable,
            }
          : null,
      createdAt: run.createdAt,
      completedAt: terminal ? (last?.occurredAt ?? run.createdAt) : null,
    };
  };

  // -------------------------------------------------------------------------
  // SSE
  // -------------------------------------------------------------------------

  const accessible = (run: MockRun | undefined): run is MockRun =>
    run !== undefined && !deletedNotes.has(run.noteId);

  /**
   * `afterSeq` 다음 frame부터 terminal까지(또는 장애·Note 삭제까지) 보낸다.
   * 소비자가 읽을 때마다 chunk 하나를 만든다(highWaterMark 0). 그래서 `network` 장애의 `error()`가
   * 아직 읽지 않은 frame을 버리지 않는다 — 장애 전 frame은 모두 전달된 뒤 끊긴다.
   */
  const streamRun = (
    run: MockRun,
    afterSeq: number,
    fault: MockConnectionFault | undefined,
    signal: AbortSignal,
  ) => {
    const encoder = new TextEncoder();
    let closed = false;
    let wake: () => void = () => {};
    let index = afterSeq;
    let sent = 0;

    const release = () => {
      if (closed) return false;
      closed = true;
      openConnections -= 1;
      wake(); // 대기 중인 pull·heartbeat를 끝낸다.
      return true;
    };

    /** commit·종료를 기다린다. heartbeat 간격이 지나면 "heartbeat" */
    const waitForChange = () =>
      new Promise<"changed" | "heartbeat">((resolve) => {
        const heartbeat =
          heartbeatMs === undefined
            ? undefined
            : setTimeout(() => done("heartbeat"), heartbeatMs);
        const done = (result: "changed" | "heartbeat") => {
          if (heartbeat !== undefined) clearTimeout(heartbeat);
          run.waiters.delete(wake);
          resolve(result);
        };
        wake = () => done("changed");
        run.waiters.add(wake);
        if (closed) wake();
      });

    return new ReadableStream<Uint8Array>(
      {
        start(controller) {
          openConnections += 1;
          signal.addEventListener(
            "abort",
            () => {
              if (!release()) return;
              try {
                controller.close();
              } catch {
                // 이미 닫혔다.
              }
            },
            { once: true },
          );
        },
        async pull(controller) {
          const finish = (mode: "eof" | "network") => {
            if (!release()) return;
            if (mode === "network")
              controller.error(new TypeError("mock network error"));
            else controller.close();
          };
          while (!closed) {
            if (deletedNotes.has(run.noteId)) return finish("eof");
            if (fault?.kind === "disconnect" && sent >= fault.afterFrames)
              return finish(fault.mode ?? "eof");
            if (index < run.committed) {
              const frame = run.frames[index++];
              const chunk = encodeFrame(frame);
              controller.enqueue(
                encoder.encode(
                  fault?.kind === "duplicate" ? chunk + chunk : chunk,
                ),
              );
              sent += 1;
              if (isTerminalFrame(frame)) finish("eof");
              return;
            }
            if (!isRunActive(run)) return finish("eof");
            if ((await waitForChange()) === "heartbeat" && !closed) {
              controller.enqueue(encoder.encode(HEARTBEAT_COMMENT));
              return;
            }
          }
        },
        cancel() {
          release();
        },
      },
      { highWaterMark: 0 },
    );
  };

  const sse = (stream: ReadableStream<Uint8Array>) =>
    new HttpResponse(stream, { status: 200, headers: SSE_HEADERS });

  const contractOutError = (status = 500) =>
    HttpResponse.json(
      {
        isSuccess: false,
        code: "COMMON500",
        message: "서버 내부 오류가 발생했습니다.",
      },
      { status },
    );

  /** cursor(`{runId}:{seq}`) → 보낼 첫 frame 앞 seq. 형식 오류면 RunErrorCode */
  const parseCursor = (
    run: MockRun,
    cursor: string | null,
  ): number | "RUN4003" | "RUN4004" => {
    if (cursor === null) return 0;
    const match = /^([0-9a-f-]{36}):([1-9][0-9]*)$/.exec(cursor);
    if (!match) return "RUN4003";
    if (match[1] !== run.runId) return "RUN4004";
    const seq = Number(match[2]);
    return seq > run.committed ? "RUN4003" : seq;
  };

  const path = (suffix: string) => `${baseUrl}${suffix}`;

  const handlers = [
    http.post(path("/api/conversations"), async ({ request }) => {
      const entry: MockRequestLog = {
        method: "POST",
        path: "/api/conversations",
        lastEventId: null,
        requestId: null,
        status: 200,
      };
      const respond = (response: Response) => {
        entry.status = response.status;
        log(entry);
        return response;
      };

      let body: unknown;
      try {
        body = JSON.parse(await request.text());
      } catch {
        return respond(errorResponse(400, "RUN4001"));
      }
      const check = validateConversationRequest(body);
      if (!check.ok)
        return respond(errorResponse(ERROR_STATUS[check.code], check.code));
      const runRequest = check.request;
      entry.requestId = runRequest.requestId;

      const fault = faults.conversation.shift();
      if (fault?.kind === "error")
        return respond(contractOutError(fault.status));

      const requestKey = JSON.stringify(runRequest);
      const existing = [...runs.values()].find(
        (run) => run.requestId === runRequest.requestId,
      );
      if (existing) {
        if (existing.requestKey !== requestKey)
          return respond(errorResponse(409, "RUN4092"));
        return respond(sse(streamRun(existing, 0, fault, request.signal)));
      }

      if (
        runRequest.noteId !== undefined &&
        deletedNotes.has(runRequest.noteId)
      )
        return respond(errorResponse(404, "RUN4041"));

      const rejection = admissionRejections.shift();
      if (rejection)
        return respond(
          errorResponse(ERROR_STATUS[rejection.code], rejection.code, {
            headers:
              rejection.retryAfterSeconds === undefined
                ? undefined
                : { "Retry-After": String(rejection.retryAfterSeconds) },
          }),
        );

      if (runRequest.noteId !== undefined) {
        const active = [...runs.values()].find(
          (run) => run.noteId === runRequest.noteId && isRunActive(run),
        );
        if (active)
          return respond(
            errorResponse(409, "RUN4091", {
              result: { activeRunId: active.runId },
            }),
          );
      }

      const run = createRun({
        templateName: templateQueue.shift() ?? defaultTemplate,
        noteId: runRequest.noteId ?? String(nextNoteId++),
        request: runRequest,
        requestKey,
      });
      return respond(sse(streamRun(run, 0, fault, request.signal)));
    }),

    http.get(path("/api/ai-runs/:runId/events"), ({ request, params }) => {
      const url = new URL(request.url);
      const cursor =
        request.headers.get("Last-Event-ID") ??
        url.searchParams.get("lastEventId");
      const entry: MockRequestLog = {
        method: "GET",
        path: `/api/ai-runs/${String(params.runId)}/events`,
        lastEventId: cursor,
        requestId: null,
        status: 200,
      };
      const respond = (response: Response) => {
        entry.status = response.status;
        log(entry);
        return response;
      };

      const run = runs.get(String(params.runId));
      if (!accessible(run)) return respond(errorResponse(404, "RUN4041"));
      const fault = faults.events.shift();
      if (fault?.kind === "error")
        return respond(contractOutError(fault.status));
      const afterSeq = parseCursor(run, cursor);
      if (typeof afterSeq === "string")
        return respond(errorResponse(400, afterSeq));
      return respond(
        sse(
          streamRun(
            run,
            fault?.kind === "ignore-cursor" ? 0 : afterSeq,
            fault,
            request.signal,
          ),
        ),
      );
    }),

    http.get(path("/api/ai-runs/:runId"), ({ params }) => {
      const run = runs.get(String(params.runId));
      if (!accessible(run)) return errorResponse(404, "RUN4041");
      return successResponse(runStatus(run));
    }),

    http.post(
      path("/api/ai-runs/:runId/cancel"),
      async ({ request, params }) => {
        const entry: MockRequestLog = {
          method: "POST",
          path: `/api/ai-runs/${String(params.runId)}/cancel`,
          lastEventId: null,
          requestId: null,
          status: 200,
        };
        const respond = (response: Response) => {
          entry.status = response.status;
          log(entry);
          return response;
        };
        // cancel/cases.json precedence: body 있음(RUN4001) → run 접근(RUN4041) → 상태
        if ((await request.text()).length > 0)
          return respond(errorResponse(400, "RUN4001"));
        const run = runs.get(String(params.runId));
        if (!accessible(run)) return respond(errorResponse(404, "RUN4041"));
        return respond(successResponse(cancelRun(run)));
      },
    ),

    http.get(
      path("/api/conversations/:noteId/messages"),
      ({ request, params }) => {
        const noteId = String(params.noteId);
        if (deletedNotes.has(noteId)) return errorResponse(404, "RUN4041");
        const limit = new URL(request.url).searchParams.get("limit");
        return successResponse(
          conversationPage(noteId, limit === null ? undefined : Number(limit)),
        );
      },
    ),
  ];

  return {
    handlers,
    /** 다른 탭·이전 세션이 만든 run을 미리 둔다(409·새로고침 복원). runId를 돌려준다. */
    seedRun: ({ template, noteId, committed, text }: MockRunSeed) => {
      const run = createRun({
        templateName: template ?? defaultTemplate,
        noteId,
        request: null,
        requestKey: "",
        committed,
      });
      if (text !== undefined)
        run.request = { requestId: run.requestId, noteId, text };
      return run.runId;
    },
    commit,
    /** 다음 `kind` 연결 하나에 장애를 건다(FIFO). */
    injectFault: (kind: MockConnectionKind, fault: MockConnectionFault) => {
      faults[kind].push(fault);
    },
    /** 다음 새 접수 하나를 거부한다(FIFO). */
    rejectNextConversation: (rejection: MockAdmissionRejection) => {
      admissionRejections.push(rejection);
    },
    /** 다음 새 run 하나의 template(FIFO). */
    useTemplateForNextRun: (name: StreamTemplateName) => {
      templateQueue.push(name);
    },
    /** Note 삭제: 열린 연결은 frame 없이 닫히고, 이후 조회·재접속은 RUN4041이다. */
    deleteNote: (noteId: NoteId) => {
      deletedNotes.add(noteId);
      for (const run of runs.values()) if (run.noteId === noteId) notify(run);
    },
    getRun: (runId: Uuid) => {
      const run = runs.get(runId);
      return run
        ? {
            runId: run.runId,
            requestId: run.requestId,
            noteId: run.noteId,
            status: statusOf(run),
            committed: run.committed,
            frames: structuredClone(run.frames),
          }
        : null;
    },
    listRunIds: () => [...runs.keys()],
    /** 처리한 요청 기록(복사본) */
    getRequests: () => requests.map((entry) => ({ ...entry })),
    /** 열려 있는 SSE 연결 수 */
    getOpenConnections: () => openConnections,
    reset: () => {
      for (const run of runs.values()) if (run.pacing) clearTimeout(run.pacing);
      runs.clear();
      deletedNotes.clear();
      faults.conversation.length = 0;
      faults.events.length = 0;
      admissionRejections.length = 0;
      templateQueue.length = 0;
      requests.length = 0;
      nextNoteId = 9001;
    },
  };
};

export type BrowserRunMockServer = ReturnType<
  typeof createBrowserRunMockServer
>;
