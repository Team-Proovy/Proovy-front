import type { PublicRunStatus } from "@/shared/contracts/browser_run_v1";
import { isTerminalRunStatus } from "./run_reducer";
import type { ActivityOutcome, ActivityView, RunState } from "./run_state";

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
  state.status === "PENDING" ||
  state.status === "RUNNING" ||
  state.status === "CANCELING";

export const selectIsCanceling = (state: RunState) =>
  state.status === "CANCELING";

/** 정지 버튼을 보낼 수 있는 상태(PENDING·RUNNING). CANCELING·terminal은 false다. */
export const selectCanCancel = (state: RunState) =>
  state.status === "PENDING" || state.status === "RUNNING";

/** 재접속 cursor(`Last-Event-ID`). 아직 처리한 frame이 없으면 null이다. */
export const selectCursor = (state: RunState) => state.cursor;

/**
 * 처음 등장 순서의 Activity 목록.
 * run이 terminal인데 열린 Activity는 run 결과(completed·failed·canceled)로 닫아 `closedByRun: true`로 투영한다.
 * 저장된 state는 바꾸지 않는다.
 */
export const selectActivities = (state: RunState): ActivityView[] => {
  const closedPhase =
    state.status === null ? undefined : CLOSED_BY_RUN[state.status];
  return state.activityOrder.map((activityId) => {
    const entry = state.activities[activityId];
    const closedByRun = entry.phase === "running" && closedPhase !== undefined;
    return {
      ...entry,
      phase: closedByRun ? closedPhase : entry.phase,
      closedByRun,
    };
  });
};

/** `response.page.*` 경계(pageIndex 순). 본문은 `selectResponse`에서만 나온다. */
export const selectPageBoundaries = (state: RunState) => state.pages;

/** canonical 응답. COMPLETED 전에는 항상 null이다. */
export const selectResponse = (state: RunState) => state.response;

export const selectFailure = (state: RunState) => state.failure;

export const selectCancel = (state: RunState) => state.cancel;
