import {
  TERMINAL_RUN_STATUSES,
  toEventId,
  type ActivityFrame,
  type AssistantConversationMessage,
  type BrowserFrame,
  type ConversationPage,
  type PublicRunStatus,
  type Uuid,
} from "@/shared/contracts/browser_run_v1";
import type {
  ActivityEntry,
  RunAction,
  RunIdentity,
  RunState,
} from "./run_state";

const EMPTY_IDENTITY: RunIdentity = {
  requestId: null,
  noteId: null,
  userMessageId: null,
  assistantMessageId: null,
  requestedTasks: [],
};

export const createInitialRunState = (): RunState => ({
  runId: null,
  status: null,
  identity: EMPTY_IDENTITY,
  lastSeq: 0,
  cursor: null,
  activityOrder: [],
  activities: {},
  pages: [],
  response: null,
  failure: null,
  cancel: null,
});

export const isTerminalRunStatus = (status: PublicRunStatus | null) =>
  status !== null &&
  (TERMINAL_RUN_STATUSES as readonly string[]).includes(status);

/**
 * run 하나의 상태 reducer (순수 함수).
 *
 * 반영하지 않는 입력은 같은 state 참조를 그대로 돌려준다:
 * terminal 뒤 입력, 다른 run의 frame, `seq <= lastSeq`(같은 event id 재전달 포함), heartbeat,
 * started 없이 온 activity 후속 이벤트, 이미 outcome이 정해진 Activity의 이벤트.
 */
export const runReducer = (state: RunState, action: RunAction): RunState => {
  if (isTerminalRunStatus(state.status)) return state;
  switch (action.type) {
    case "frame":
      return applyFrame(state, action.frame);
    case "conversation":
      return applyConversation(state, action.page, action.runId);
    case "heartbeat":
      return state;
  }
};

/** frame 목록을 차례로 반영한다(테스트·replay 편의). */
export const reduceFrames = (
  frames: readonly BrowserFrame[],
  state: RunState = createInitialRunState(),
) =>
  frames.reduce(
    (current, frame) => runReducer(current, { type: "frame", frame }),
    state,
  );

// ---------------------------------------------------------------------------
// frame
// ---------------------------------------------------------------------------

const applyFrame = (state: RunState, frame: BrowserFrame): RunState => {
  if (state.runId !== null && frame.runId !== state.runId) return state;
  if (frame.seq <= state.lastSeq) return state;

  const next = applyFramePayload(state, frame);
  if (next === null) return state;
  return {
    ...next,
    runId: frame.runId,
    lastSeq: frame.seq,
    cursor: toEventId(frame.runId, frame.seq),
  };
};

/** 진행 frame은 PENDING을 RUNNING으로 올린다. CANCELING은 되돌리지 않는다. */
const progressed = (status: PublicRunStatus | null): PublicRunStatus =>
  status === "CANCELING" ? "CANCELING" : "RUNNING";

/** `null`이면 무시할 frame이다(cursor도 움직이지 않는다). */
const applyFramePayload = (
  state: RunState,
  frame: BrowserFrame,
): RunState | null => {
  switch (frame.type) {
    case "run.created": {
      const { payload } = frame;
      return {
        ...state,
        status: state.status ?? "PENDING",
        identity: {
          requestId: payload.requestId,
          noteId: payload.noteId,
          userMessageId: payload.userMessageId,
          assistantMessageId: payload.assistantMessageId,
          requestedTasks: [...payload.requestedTasks],
        },
      };
    }
    case "activity.started":
    case "activity.updated":
    case "activity.completed":
    case "activity.failed":
    case "activity.canceled":
      return applyActivityFrame(state, frame);
    case "response.page.started": {
      const { payload } = frame;
      if (
        state.pages.some(
          (page) => page.responsePageId === payload.responsePageId,
        )
      )
        return state;
      const pages = [
        ...state.pages,
        {
          responsePageId: payload.responsePageId,
          pageIndex: payload.pageIndex,
          presentation: payload.presentation,
          completed: false,
        },
      ].sort((left, right) => left.pageIndex - right.pageIndex);
      return { ...state, status: progressed(state.status), pages };
    }
    case "response.page.completed": {
      const { payload } = frame;
      return {
        ...state,
        status: progressed(state.status),
        pages: state.pages.map((page) =>
          page.responsePageId === payload.responsePageId
            ? { ...page, completed: true }
            : page,
        ),
      };
    }
    case "run.canceling":
      return { ...state, status: "CANCELING" };
    case "run.completed": {
      const { payload } = frame;
      return {
        ...state,
        status: "COMPLETED",
        response: {
          assistantMessageId: payload.assistantMessageId,
          responseDisposition: payload.responseDisposition,
          clarificationReason: payload.clarificationReason ?? null,
          assistantResponse: payload.assistantResponse,
          verificationSummary: payload.verificationSummary ?? [],
        },
      };
    }
    case "run.failed": {
      const { payload } = frame;
      return {
        ...state,
        status: "FAILED",
        failure: {
          code: payload.code,
          reason: payload.reason ?? null,
          message: payload.message,
          recoverable: payload.recoverable,
        },
      };
    }
    case "run.canceled": {
      const { payload } = frame;
      return {
        ...state,
        status: "CANCELED",
        cancel: { cause: payload.cause, message: payload.message },
      };
    }
  }
};

// ---------------------------------------------------------------------------
// activity
// ---------------------------------------------------------------------------

const createActivityEntry = (
  frame: Extract<ActivityFrame, { type: "activity.started" }>,
): ActivityEntry => ({
  activityId: frame.payload.activityId,
  kind: frame.payload.kind,
  label: frame.payload.label,
  responsePageId: null,
  phase: "running",
  progressStatus: null,
  message: null,
  methodLabel: null,
  stepProgress: null,
  pageProgress: null,
  targets: [],
  reason: null,
  assetOutcome: null,
  matchStatus: null,
  limitedPages: [],
  durationMs: null,
  failureCode: null,
  startedSeq: frame.seq,
  updatedSeq: frame.seq,
});

/** kind별 payload 필드를 Activity에 옮긴다. payload에 없는 필드는 이전 값을 유지한다. */
const mergeActivityPayload = (
  entry: ActivityEntry,
  frame: ActivityFrame,
): ActivityEntry => {
  const payload = frame.payload;
  const next: ActivityEntry = { ...entry, updatedSeq: frame.seq };

  if ("message" in payload && payload.message != null)
    next.message = payload.message;
  if ("methodLabel" in payload) next.methodLabel = payload.methodLabel;
  if ("progress" in payload) next.stepProgress = { ...payload.progress };
  if ("processedPages" in payload)
    next.pageProgress = {
      processedPages: payload.processedPages,
      totalPages: payload.totalPages,
    };

  switch (frame.type) {
    case "activity.started": {
      const started = frame.payload;
      next.label = started.label;
      next.responsePageId = started.responsePageId ?? null;
      if (started.kind === "asset_understanding") {
        next.reason = started.reason;
        next.targets = started.targets.map((target) => ({ ...target }));
      }
      break;
    }
    case "activity.updated":
      next.progressStatus = frame.payload.status ?? next.progressStatus;
      break;
    case "activity.completed": {
      const completed = frame.payload;
      next.phase = "completed";
      if (completed.kind === "asset_understanding")
        next.assetOutcome = completed.outcome ?? null;
      if (completed.kind === "note_retrieval") {
        next.matchStatus = completed.matchStatus;
        next.limitedPages = (completed.pages ?? []).map((page) => ({
          ...page,
        }));
      }
      if (completed.kind === "code_execution")
        next.durationMs = completed.durationMs ?? null;
      break;
    }
    case "activity.failed":
      next.phase = "failed";
      next.failureCode = frame.payload.code;
      break;
    case "activity.canceled":
      next.phase = "canceled";
      break;
  }
  return next;
};

const applyActivityFrame = (
  state: RunState,
  frame: ActivityFrame,
): RunState | null => {
  const { activityId, kind } = frame.payload;
  const existing = state.activities[activityId];

  // started 없는 후속 이벤트(대화 조회로 중간부터 이어 받은 경우)와 kind가 다른 이벤트는 반영하지 않는다.
  if (!existing && frame.type !== "activity.started") return null;
  if (existing && existing.kind !== kind) return null;
  // terminal outcome은 덮어쓰지 않는다.
  if (existing && existing.phase !== "running") return null;

  const entry = mergeActivityPayload(
    existing ??
      createActivityEntry(
        frame as Extract<ActivityFrame, { type: "activity.started" }>,
      ),
    frame,
  );
  return {
    ...state,
    status: progressed(state.status),
    activityOrder: existing
      ? state.activityOrder
      : [...state.activityOrder, activityId],
    activities: { ...state.activities, [activityId]: entry },
  };
};

// ---------------------------------------------------------------------------
// 대화 조회 초기화
// ---------------------------------------------------------------------------

const findAssistantMessage = (page: ConversationPage, runId: Uuid) =>
  page.messages.find(
    (message): message is AssistantConversationMessage =>
      message.role === "assistant" && message.runId === runId,
  );

/**
 * 대화 조회로 run 하나를 초기화한다.
 * - activeRun: status·`lastSeq`·cursor를 그 값으로 올린다. 이후 `seq > lastSeq` frame만 반영된다.
 * - terminal assistant message: 결과(응답·실패·취소)로 terminal 상태를 만든다. seq는 알 수 없어 0으로 둔다.
 * 이미 더 앞선 seq를 처리했거나 다른 run을 보고 있으면 바꾸지 않는다.
 */
const applyConversation = (
  state: RunState,
  page: ConversationPage,
  requestedRunId?: Uuid,
): RunState => {
  const runId = requestedRunId ?? page.activeRun?.runId;
  if (runId === undefined) return state;
  if (state.runId !== null && state.runId !== runId) return state;

  const assistant = findAssistantMessage(page, runId);
  const identity: RunIdentity = {
    ...state.identity,
    noteId: state.identity.noteId ?? page.noteId,
    assistantMessageId:
      state.identity.assistantMessageId ?? assistant?.messageId ?? null,
  };

  const activeRun = page.activeRun?.runId === runId ? page.activeRun : null;
  if (activeRun) {
    if (activeRun.lastSeq <= state.lastSeq) {
      return state.runId === null ? { ...state, runId, identity } : state;
    }
    return {
      ...state,
      runId,
      identity,
      status: state.status === "CANCELING" ? "CANCELING" : activeRun.status,
      lastSeq: activeRun.lastSeq,
      cursor: toEventId(runId, activeRun.lastSeq),
    };
  }

  if (!assistant) return state;
  const content = assistant.assistant;
  switch (assistant.status) {
    case "COMPLETED":
      if (!content.assistantResponse || !content.responseDisposition)
        return state;
      return {
        ...state,
        runId,
        identity,
        status: "COMPLETED",
        response: {
          assistantMessageId: assistant.messageId,
          responseDisposition: content.responseDisposition,
          clarificationReason: content.clarificationReason,
          assistantResponse: content.assistantResponse,
          verificationSummary: content.verificationSummary,
        },
      };
    case "FAILED":
      if (!content.failure) return state;
      return {
        ...state,
        runId,
        identity,
        status: "FAILED",
        failure: { ...content.failure },
      };
    case "CANCELED":
      if (!content.cancel) return state;
      return {
        ...state,
        runId,
        identity,
        status: "CANCELED",
        cancel: { ...content.cancel },
      };
    case "PENDING":
    case "STREAMING":
      // activeRun이 아닌 진행 중 placeholder는 상태 근거가 없다(본문도 비공개).
      return state.runId === null ? { ...state, runId, identity } : state;
  }
};
