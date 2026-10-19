import {
  ACTIVE_RUN_STATUSES,
  type PublicRunStatus,
} from "@/shared/contracts/browser_run_v1";
import { isTerminalRunStatus } from "./run_reducer";
import type {
  ActivityEntry,
  ActivityOutcome,
  ActivityView,
  RunState,
} from "./run_state";

/** run 결과에 맞춘 Activity 닫힘 표시 (1.80 메모: terminal 뒤 남은 열린 Activity) */
const CLOSED_BY_RUN: Partial<Record<PublicRunStatus, ActivityOutcome>> = {
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",
};

export const selectRunStatus = (state: RunState) => state.status;

export const selectIsTerminal = (state: RunState) =>
  isTerminalRunStatus(state.status);

/** Active Run 동안(PENDING·RUNNING·CANCELING) true */
export const selectIsActive = (state: RunState) =>
  state.status !== null &&
  (ACTIVE_RUN_STATUSES as readonly string[]).includes(state.status);

export const selectIsCanceling = (state: RunState) =>
  state.status === "CANCELING";

/** 정지 버튼을 보낼 수 있는 상태(PENDING·RUNNING). CANCELING·terminal은 false다. */
export const selectCanCancel = (state: RunState) =>
  state.status === "PENDING" || state.status === "RUNNING";

/** 재접속 cursor(`Last-Event-ID`). 아직 처리한 frame이 없으면 null이다. */
export const selectCursor = (state: RunState) => state.cursor;

const activitiesCache = new WeakMap<RunState, ActivityView[]>();
const viewCache = new WeakMap<
  ActivityEntry,
  { closedPhase: ActivityOutcome | undefined; view: ActivityView }
>();

const toActivityView = (
  entry: ActivityEntry,
  closedPhase: ActivityOutcome | undefined,
): ActivityView => {
  const cached = viewCache.get(entry);
  if (cached && cached.closedPhase === closedPhase) return cached.view;
  const closedByRun = entry.phase === "running" && closedPhase !== undefined;
  const view: ActivityView = {
    ...entry,
    phase: closedByRun ? closedPhase : entry.phase,
    closedByRun,
  };
  viewCache.set(entry, { closedPhase, view });
  return view;
};

/**
 * 처음 등장 순서의 Activity 목록.
 * run이 terminal인데 열린 Activity는 run 결과(completed·failed·canceled)로 닫아 `closedByRun: true`로 투영한다.
 * 저장된 state는 바꾸지 않는다.
 *
 * 같은 state에는 같은 배열을, 바뀌지 않은 Activity에는 같은 view 객체를 돌려준다
 * (zustand·`useSyncExternalStore` selector로 바로 써도 snapshot이 안정적이다).
 */
export const selectActivities = (state: RunState): ActivityView[] => {
  const cached = activitiesCache.get(state);
  if (cached) return cached;
  const closedPhase =
    state.status === null ? undefined : CLOSED_BY_RUN[state.status];
  const views = state.activityOrder.map((activityId) =>
    toActivityView(state.activities[activityId], closedPhase),
  );
  activitiesCache.set(state, views);
  return views;
};

/** `response.page.*` 경계(pageIndex 순). 본문은 `selectResponse`에서만 나온다. */
export const selectPageBoundaries = (state: RunState) => state.pages;

/** canonical 응답. COMPLETED 전에는 항상 null이다. */
export const selectResponse = (state: RunState) => state.response;

export const selectFailure = (state: RunState) => state.failure;

export const selectCancel = (state: RunState) => state.cancel;
