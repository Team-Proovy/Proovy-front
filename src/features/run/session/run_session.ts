import type {
  BrowserFrame,
  ConversationPage,
  ConversationRunRequest,
  NoteId,
  PublicRunStatus,
  RunCancelOutcome,
  RunCancelResult,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import { createConversationRequest, runApi, RunApiError } from "../api";
import type {
  ConversationQuestionInput,
  RequestValidationIssue,
  RunApiClient,
  RunApiErrorDetail,
  RunStreamEnd,
  RunStreamOptions,
} from "../api";
import {
  createInitialRunState,
  runReducer,
  selectCanCancel,
  selectIsActive,
  selectIsTerminal,
} from "../model";
import type { RunState } from "../model";
import { RECONNECT_BACKOFF, reconnectDelay } from "./reconnect_backoff";
import type { ReconnectBackoff } from "./reconnect_backoff";

/**
 * Note 하나의 run 세션 (S08 ACT-03: 전송·재접속·복원·정지).
 *
 * - 전송: POST SSE frame을 1.90 reducer에 넣는다. `run.created` 전에 끊기면 같은 request(같은 requestId)로
 *   다시 POST한다(Server가 기존 run을 seq 1부터 replay, reducer가 seq로 중복을 버린다).
 * - terminal 없이 끊기면 reducer cursor(마지막 처리 frame id)로 `GET /events`에 backoff 재접속한다.
 *   단절은 취소가 아니다. 404 RUN4041이면 멈춘다.
 * - 409 RUN4091·Note 진입 복원은 그 run에 cursor 없이 붙어 seq 1부터 받는다(Activity·page까지 복원, spec 08).
 * - 정지는 `POST /cancel`만 쓴다. `dispose()`(화면 이탈·Note 전환)는 연결만 끊고 run을 취소하지 않는다.
 * - 어떤 경우에도 스스로 새 질문을 보내지 않는다. 보내지 못한 입력은 `draft`로 남긴다.
 */

/** 전송 입력. noteId는 세션이 정한다(생성 시 값 또는 `run.created`로 알게 된 값). */
export type RunSessionInput = Omit<ConversationQuestionInput, "noteId">;

/**
 * - `idle`: 연결 없음 (아직 run이 없거나 terminal, 또는 접수 거부)
 * - `connecting`: POST·GET /events 요청을 보냈고 SSE 응답 전
 * - `streaming`: SSE 수신 중
 * - `backoff`: terminal 없이 끊겨 재접속을 기다리는 중 (`reconnect` 참고)
 * - `stopped`: 재접속하지 않는다 (`problem` 참고: not_found·unauthorized·reconnect_exhausted·stream_rejected·unexpected)
 */
export type RunSessionConnection =
  | "idle"
  | "connecting"
  | "streaming"
  | "backoff"
  | "stopped";

export interface RunSessionReconnect {
  /** 진행(새 frame) 없이 연속 실패한 횟수. 1부터 */
  attempt: number;
  delayMs: number;
  /** 재접속 예정 시각(epoch ms) */
  retryAt: number;
}

/**
 * 화면이 사용자 문구로 바꿀 typed 상태.
 * - `invalid_request`: 보내기 전 계약 검사 실패 (RUN4001·RUN4002)
 * - `rejected`: 전송(POST)의 접수 거부. `detail.code`로 구분한다(RUN4291 `retryAfterSeconds`·RUN4021 잔액 부족·
 *   RUN4221·RUN4092 등, 계약 밖이면 `code: null`). RUN4291이면 `retryAt`(epoch ms)이 있다. 자동 재전송하지 않는다.
 *   RUN4041은 여기가 아니라 `not_found`다.
 * - `not_found`: 404 RUN4041 — Note 삭제·없는 run. 전송(`during: "send"`, draft 유지)·재접속(`"events"`)·
 *   정지(`"cancel"`) 어느 경로든 같은 kind다. 재접속을 멈췄다
 * - `unauthorized`: token 갱신까지 실패한 401 — 재접속하지 않고 로그인 흐름으로 보냈다
 * - `reconnect_exhausted`: 진행 없이 `maxAttempts`번 연속 실패 — `reconnect()`로 다시 시도할 수 있다
 * - `stream_rejected`: 재접속(GET /events)의 그 밖 거부(RUN4003·RUN4004·계약 밖 4xx). 계약상 생기지 않아야 하며
 *   `reconnect()`·`restore()`로 다시 시도할 수 있다
 * - `restore_failed`: Note 진입 대화 조회 실패
 * - `unexpected`: 계약 밖 예외(버그) — 연결을 멈췄다
 */
export type RunSessionProblem =
  | {
      kind: "invalid_request";
      code: "RUN4001" | "RUN4002";
      issues: RequestValidationIssue[];
    }
  | { kind: "rejected"; detail: RunApiErrorDetail; retryAt: number | null }
  | { kind: "not_found"; during: "send" | "events" | "cancel" }
  | { kind: "unauthorized" }
  | { kind: "reconnect_exhausted"; attempts: number }
  | { kind: "stream_rejected"; detail: RunApiErrorDetail }
  | { kind: "restore_failed"; error: unknown }
  | { kind: "unexpected"; error: unknown };

/** 정지 요청 상태. `done.outcome`으로 accepted·already_canceling·already_terminal을 구분한다. */
export type RunSessionCancel =
  | { phase: "idle" }
  | { phase: "requesting" }
  | { phase: "done"; outcome: RunCancelOutcome; status: PublicRunStatus }
  | { phase: "failed"; error: unknown };

/**
 * 지금 보고 있는 run을 어떻게 붙었는지.
 * `active_run_conflict`는 409 RUN4091로 다른 탭·이전 전송의 run에 붙은 것이다(보낸 입력은 `draft`에 있다).
 */
export type RunSessionOrigin = "send" | "active_run_conflict" | "restore";

export interface RunSessionSnapshot {
  /** 이 세션의 Note. 첫 질문이면 `run.created`의 noteId로 채워진다. */
  noteId: NoteId | null;
  /** 1.90 reducer state (`selectActivities` 등 model selector로 읽는다) */
  run: RunState;
  origin: RunSessionOrigin | null;
  connection: RunSessionConnection;
  reconnect: RunSessionReconnect | null;
  /**
   * Server가 아직 받지 않은(또는 거부한) 입력. 전송 시작부터 `run.created`를 받을 때까지, 그리고
   * 409·접수 거부·전송 실패 뒤 남는다. 세션은 이 값을 자동으로 보내지 않는다.
   */
  draft: RunSessionInput | null;
  problem: RunSessionProblem | null;
  cancel: RunSessionCancel;
  /** 새 질문을 보낼 수 있는지. Active Run(PENDING·RUNNING·CANCELING)·연결 중·정지 요청 중에는 false */
  canSend: boolean;
  /** 정지 버튼을 보낼 수 있는지. runId를 알고 PENDING·RUNNING이며 정지 요청이 아직 받아들여지지 않았을 때 */
  canCancel: boolean;
}

export type RunSendResult =
  | { ok: true; requestId: Uuid }
  | { ok: false; reason: "busy" }
  | {
      ok: false;
      reason: "invalid";
      code: "RUN4001" | "RUN4002";
      issues: RequestValidationIssue[];
    };

export interface RunSession {
  getSnapshot: () => RunSessionSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** 새 질문 전송. `canSend`가 false면 보내지 않는다. */
  send: (input: RunSessionInput) => RunSendResult;
  /** 정지(`POST /cancel`). `canCancel`이 false면 보내지 않고 null. 실패하면 null(`cancel.phase: "failed"`). */
  cancel: () => Promise<RunCancelResult | null>;
  /**
   * Note 진입·새로고침 복원. 대화 조회(`page`를 주지 않으면 첫 페이지를 조회)의 `activeRun`이 있으면 그 run에
   * cursor 없이 붙어 seq 1부터 받는다. 받은(또는 조회한) 페이지를 돌려준다. 이미 연결 중이면 아무것도 하지 않는다.
   */
  restore: (page?: ConversationPage) => Promise<ConversationPage | null>;
  /** `stopped`(reconnect_exhausted·stream_rejected)에서 사용자가 다시 시도할 때. 재접속 횟수를 처음부터 센다. */
  reconnect: () => boolean;
  /** `draft`와 그 입력의 거부 사유(`rejected`·`invalid_request`)를 비운다(화면이 draft를 입력창으로 옮긴 뒤). */
  clearDraft: () => void;
  /** 연결만 끊는다(run 취소 아님). 진행 중인 정지 요청은 끝까지 보낸다. */
  dispose: () => void;
}

export interface RunSessionTimers {
  setTimeout: (callback: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface RunSessionOptions {
  noteId?: NoteId | null;
  api?: Pick<
    RunApiClient,
    | "streamConversation"
    | "streamRunEvents"
    | "cancelRun"
    | "getConversationMessages"
  >;
  backoff?: ReconnectBackoff;
  /** jitter 난수 `[0, 1)` */
  random?: () => number;
  timers?: RunSessionTimers;
  now?: () => number;
  /** 401(갱신 실패) 뒤 로그인 흐름으로 보낸다. 기본은 axios interceptor와 같은 `proovy:navigate` → `/error/401` */
  onUnauthorized?: () => void;
}

const UNAUTHORIZED_ROUTE = "/error/401";

// axios interceptor(`src/shared/api/client.ts` redirectToErrorRoute)와 같은 가드: 개발 모드는 명시적으로 켤 때만 이동한다.
const SHOULD_ENABLE_ERROR_REDIRECT =
  import.meta.env.VITE_ENABLE_ERROR_REDIRECT === "true" || !import.meta.env.DEV;

const navigateToLogin = () => {
  if (!SHOULD_ENABLE_ERROR_REDIRECT || typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/error/")) return;
  window.dispatchEvent(
    new CustomEvent("proovy:navigate", {
      detail: { route: UNAUTHORIZED_ROUTE },
    }),
  );
};

const defaultTimers: RunSessionTimers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) =>
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** 같은 연결 대상을 다시 시도할 만한 거부: 계약 밖 5xx·408·429(proxy·gateway 등) */
const isTransientRejection = (error: RunApiError) =>
  error.code === null &&
  (error.status >= 500 || error.status === 408 || error.status === 429);

/** 연결 대상. `send`는 `run.created` 전까지 POST, 그 뒤로는 그 run의 GET /events다. */
type Target =
  | { kind: "send"; request: ConversationRunRequest }
  | { kind: "events"; runId: Uuid };

type SnapshotFields = Omit<RunSessionSnapshot, "canSend" | "canCancel">;

const isConnected = (connection: RunSessionConnection) =>
  connection === "connecting" ||
  connection === "streaming" ||
  connection === "backoff";

const computeCanSend = (fields: SnapshotFields) => {
  if (isConnected(fields.connection)) return false;
  if (fields.cancel.phase === "requesting") return false;
  if (fields.problem?.kind === "unauthorized") return false;
  // 404로 사라진 run은 더 진행되지 않는다.
  if (fields.problem?.kind === "not_found") return true;
  return !selectIsActive(fields.run);
};

const computeCanCancel = (fields: SnapshotFields) => {
  if (fields.run.runId === null || !selectCanCancel(fields.run)) return false;
  if (
    fields.problem?.kind === "unauthorized" ||
    fields.problem?.kind === "not_found"
  )
    return false;
  // 받아들여진 정지(done)는 다시 보내지 않는다. 실패했으면 다시 누를 수 있다.
  return fields.cancel.phase === "idle" || fields.cancel.phase === "failed";
};

const withFlags = (fields: SnapshotFields): RunSessionSnapshot => ({
  ...fields,
  canSend: computeCanSend(fields),
  canCancel: computeCanCancel(fields),
});

export const createRunSession = ({
  noteId = null,
  api = runApi,
  backoff = RECONNECT_BACKOFF,
  random = Math.random,
  timers = defaultTimers,
  now = Date.now,
  onUnauthorized = navigateToLogin,
}: RunSessionOptions = {}): RunSession => {
  let fields: SnapshotFields = {
    noteId,
    run: createInitialRunState(),
    origin: null,
    connection: "idle",
    reconnect: null,
    draft: null,
    problem: null,
    cancel: { phase: "idle" },
  };
  let snapshot = withFlags(fields);
  const listeners = new Set<() => void>();
  /** 지금 연결(또는 복원 조회)의 controller. 새 연결·dispose가 abort한다. */
  let controller: AbortController | null = null;
  /** `reconnect()`가 다시 열 대상 */
  let lastTarget: Target | null = null;
  /** `dispose()` 뒤 true. 정지 응답 뒤 자동 재접속(terminal 받기)을 하지 않는다. send·restore·reconnect가 푼다. */
  let detached = false;

  const update = (patch: Partial<SnapshotFields>) => {
    fields = { ...fields, ...patch };
    snapshot = withFlags(fields);
    for (const listener of [...listeners]) listener();
  };

  const sleep = (ms: number, signal: AbortSignal) =>
    new Promise<boolean>((resolve) => {
      if (signal.aborted) return resolve(false);
      const onAbort = () => {
        timers.clearTimeout(handle);
        resolve(false);
      };
      const handle = timers.setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve(true);
      }, ms);
      signal.addEventListener("abort", onAbort, { once: true });
    });

  const stop = (problem: RunSessionProblem) => {
    update({ connection: "stopped", reconnect: null, problem });
    if (problem.kind === "unauthorized") onUnauthorized();
  };

  /**
   * 대상 하나를 terminal까지 따라간다. terminal 없이 끊기면 backoff 뒤 재접속한다.
   * `signal`이 abort되면(새 연결·dispose) 조용히 끝낸다.
   */
  const follow = async (initial: Target, signal: AbortSignal) => {
    let target = initial;
    let failures = 0;

    for (;;) {
      lastTarget = target;
      // 이미 terminal인 run에는 붙지 않는다(cursor 뒤 frame이 없어 eof → backoff 루프가 된다).
      if (selectIsTerminal(snapshot.run)) {
        update({ connection: "idle", reconnect: null });
        return;
      }
      const seqBefore = snapshot.run.lastSeq;
      update({ connection: "connecting" });

      const options: RunStreamOptions = {
        signal,
        onOpen: () => update({ connection: "streaming", reconnect: null }),
        onFrame: (frame: BrowserFrame) => {
          const run = runReducer(snapshot.run, { type: "frame", frame });
          if (run === snapshot.run) return; // 겹친 replay·같은 event id 재전달
          const accepted =
            target.kind === "send" && frame.type === "run.created";
          update({
            run,
            noteId: snapshot.noteId ?? run.identity.noteId,
            ...(accepted && { draft: null }),
          });
          // run.created를 받았으면 이 전송은 접수됐다. 이후 재접속은 같은 run의 GET /events다.
          if (target.kind === "send" && run.runId !== null)
            target = { kind: "events", runId: run.runId };
        },
      };

      let end: RunStreamEnd;
      try {
        end =
          target.kind === "send"
            ? await api.streamConversation(target.request, options)
            : await api.streamRunEvents(
                target.runId,
                { lastEventId: snapshot.run.cursor },
                options,
              );
      } catch (error) {
        if (!signal.aborted) stop({ kind: "unexpected", error });
        return;
      }
      if (signal.aborted || end.reason === "aborted") return;

      if (end.reason === "terminal") {
        update({ connection: "idle", reconnect: null });
        return;
      }

      if (end.reason === "rejected") {
        const { error } = end;
        if (error.status === 401) return stop({ kind: "unauthorized" });
        if (target.kind === "send") {
          if (error.detail.code === "RUN4091") {
            // 이미 진행 중인 run에 붙는다. 보낸 입력은 draft로 남는다(자동 재전송 없음).
            target = { kind: "events", runId: error.detail.activeRunId };
            failures = 0;
            update({
              run: createInitialRunState(),
              origin: "active_run_conflict",
              problem: null,
            });
            continue;
          }
          if (error.detail.code === "RUN4041") {
            update({
              connection: "idle",
              reconnect: null,
              problem: { kind: "not_found", during: "send" },
            });
            return;
          }
          if (!isTransientRejection(error)) {
            const retryAfter =
              error.detail.code === "RUN4291"
                ? error.detail.retryAfterSeconds
                : null;
            update({
              connection: "idle",
              reconnect: null,
              problem: {
                kind: "rejected",
                detail: error.detail,
                retryAt: retryAfter === null ? null : now() + retryAfter * 1000,
              },
            });
            return;
          }
        } else {
          if (error.detail.code === "RUN4041")
            return stop({ kind: "not_found", during: "events" });
          if (!isTransientRejection(error))
            return stop({ kind: "stream_rejected", detail: error.detail });
        }
      }

      // terminal 없이 끊김(eof·network·protocol) 또는 일시 거부 → backoff 뒤 재접속.
      // 새 frame이 들어온 연결 뒤에만 횟수를 처음부터 센다(같은 seq에서 반복되는 오류는 지연이 계속 늘어난다).
      if (snapshot.run.lastSeq > seqBefore) failures = 0;
      failures += 1;
      if (failures > backoff.maxAttempts)
        return stop({ kind: "reconnect_exhausted", attempts: failures - 1 });
      const delayMs = reconnectDelay(failures, random, backoff);
      update({
        connection: "backoff",
        reconnect: { attempt: failures, delayMs, retryAt: now() + delayMs },
      });
      if (!(await sleep(delayMs, signal))) return;
    }
  };

  const startFollowing = (target: Target) => {
    detached = false;
    controller?.abort();
    const current = new AbortController();
    controller = current;
    void follow(target, current.signal);
  };

  const send = (input: RunSessionInput): RunSendResult => {
    if (!snapshot.canSend) return { ok: false, reason: "busy" };
    const check = createConversationRequest({
      ...input,
      noteId: snapshot.noteId,
    });
    if (!check.ok) {
      update({
        draft: input,
        problem: {
          kind: "invalid_request",
          code: check.code,
          issues: check.issues,
        },
      });
      return {
        ok: false,
        reason: "invalid",
        code: check.code,
        issues: check.issues,
      };
    }
    update({
      run: createInitialRunState(),
      origin: "send",
      reconnect: null,
      draft: input,
      problem: null,
      cancel: { phase: "idle" },
    });
    startFollowing({ kind: "send", request: check.request });
    return { ok: true, requestId: check.request.requestId };
  };

  const restore = async (page?: ConversationPage) => {
    if (isConnected(snapshot.connection)) return page ?? null;
    controller?.abort();
    const current = new AbortController();
    controller = current;

    let conversation = page;
    if (!conversation) {
      if (snapshot.noteId === null) return null;
      try {
        conversation = await api.getConversationMessages(
          snapshot.noteId,
          {},
          current.signal,
        );
      } catch (error) {
        if (current.signal.aborted) return null;
        if (error instanceof RunApiError && error.status === 401)
          stop({ kind: "unauthorized" });
        else update({ problem: { kind: "restore_failed", error } });
        return null;
      }
      if (current.signal.aborted) return conversation;
    }

    controller = null; // 조회용 controller는 끝났다. 이어지는 연결은 자기 controller를 쓴다.
    detached = false;
    const { activeRun } = conversation;
    const held = snapshot.run;

    // 들고 있던 run이 진행 중으로 남아 있는데(이탈 중 끝남·재시도 소진) 대화 조회의 activeRun이 아니면,
    // 그 run의 terminal message로 끝낸다. 이 페이지에 message가 없으면 cursor로 붙어 terminal replay를 받는다.
    if (
      held.runId !== null &&
      selectIsActive(held) &&
      activeRun?.runId !== held.runId
    ) {
      const run = runReducer(held, {
        type: "conversation",
        page: conversation,
        runId: held.runId,
      });
      update({ run, connection: "idle", reconnect: null, problem: null });
      if (!activeRun && selectIsActive(run)) {
        startFollowing({ kind: "events", runId: held.runId });
        return conversation;
      }
    }
    if (!activeRun) return conversation;

    // 같은 run을 이미 들고 있으면 그 cursor로 이어 받고, 아니면 cursor 없이 seq 1부터 받는다(Activity 복원).
    const base =
      snapshot.run.runId === activeRun.runId
        ? snapshot.run
        : createInitialRunState();
    update({
      run: runReducer(base, { type: "conversation", page: conversation }),
      noteId: snapshot.noteId ?? conversation.noteId,
      origin: base === snapshot.run ? snapshot.origin : "restore",
      reconnect: null,
      problem: null,
      cancel: base === snapshot.run ? snapshot.cancel : { phase: "idle" },
    });
    // 오래된 page: 이미 terminal을 받은 run이면 붙지 않는다(follow도 같은 검사를 한다).
    startFollowing({ kind: "events", runId: activeRun.runId });
    return conversation;
  };

  const cancel = async () => {
    if (!snapshot.canCancel || snapshot.run.runId === null) return null;
    const runId = snapshot.run.runId;
    update({ cancel: { phase: "requesting" } });
    try {
      // dispose와 무관하게 끝까지 보낸다(사용자가 누른 정지는 화면을 떠나도 유효하다).
      const result = await api.cancelRun(runId);
      if (snapshot.run.runId !== runId) return result;
      update({
        cancel: {
          phase: "done",
          outcome: result.outcome,
          status: result.status,
        },
      });
      // stream이 없으면(dispose 뒤·재시도 소진) terminal을 받으려고 그 run에 한 번 다시 붙는다(재전송이 아니다).
      const stalled =
        snapshot.connection === "idle" ||
        snapshot.problem?.kind === "reconnect_exhausted" ||
        snapshot.problem?.kind === "stream_rejected";
      if (!detached && stalled && selectIsActive(snapshot.run)) {
        update({ problem: null });
        startFollowing({ kind: "events", runId });
      }
      return result;
    } catch (error) {
      if (snapshot.run.runId !== runId) return null;
      update({ cancel: { phase: "failed", error } });
      if (
        error instanceof RunApiError &&
        (error.status === 401 || error.code === "RUN4041")
      ) {
        controller?.abort();
        controller = null;
        stop(
          error.status === 401
            ? { kind: "unauthorized" }
            : { kind: "not_found", during: "cancel" },
        );
      }
      return null;
    }
  };

  const reconnect = () => {
    if (snapshot.connection !== "stopped" || !lastTarget) return false;
    const kind = snapshot.problem?.kind;
    if (kind !== "reconnect_exhausted" && kind !== "stream_rejected")
      return false;
    // runId를 알면 그 run의 GET /events(reducer cursor), 아니면 같은 request(같은 requestId)로 다시 POST한다.
    const { runId } = snapshot.run;
    update({ problem: null });
    startFollowing(runId === null ? lastTarget : { kind: "events", runId });
    return true;
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send,
    cancel,
    restore,
    reconnect,
    clearDraft: () => {
      const kind = snapshot.problem?.kind;
      const clearsProblem = kind === "rejected" || kind === "invalid_request";
      update({ draft: null, ...(clearsProblem && { problem: null }) });
    },
    dispose: () => {
      detached = true;
      controller?.abort();
      controller = null;
      if (isConnected(snapshot.connection))
        update({ connection: "idle", reconnect: null });
    },
  };
};
