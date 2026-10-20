import type {
  AssistantConversationMessage,
  ConversationMessage,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import type { RunState } from "@/features/run/model";
import type { RunSessionInput } from "@/features/run/session";
import type { SentInputs } from "./run_session_registry";

/** 화면이 그리는 user 메시지 (text·latex) */
export interface TurnUser {
  text: string;
  latex: string | null;
}

/**
 * assistant 자리.
 * - `history`: 대화 조회 메시지(완료 응답·실패·중단·진행 placeholder)
 * - `live`: 이 화면의 run 세션이 받은 run (진행 중 Activity 박스, terminal 뒤 canonical 응답)
 * - `pending`: Server가 아직 받지 않은 전송(`run.created` 전)
 */
export type TurnAssistant =
  | { kind: "history"; message: AssistantConversationMessage }
  | { kind: "live"; run: RunState }
  | { kind: "pending" };

/** 질문 하나와 그 답변. 같은 run의 user·assistant 메시지를 묶는다. */
export interface ConversationTurn {
  key: string;
  runId: Uuid | null;
  user: TurnUser | null;
  assistant: TurnAssistant | null;
}

const toTurnUser = (input: RunSessionInput): TurnUser => ({
  text: input.text,
  latex: input.latex ?? null,
});

/**
 * 대화 조회 메시지(createdAt 오름차순)와 이 화면의 live run을 runId로 합친다.
 *
 * - 같은 runId면 assistant는 live run으로 그린다(Activity가 있고, 조회 뒤 진행·완료가 반영된다).
 * - 조회에 아직 없는 live run은 뒤에 붙이고, user는 화면이 보낸 입력(requestId)으로 그린다.
 * - `pending`은 `run.created` 전 전송이다. key를 requestId로 두어 접수되면 같은 자리(같은 key)가 live run이 된다.
 */
export const buildConversationTurns = (
  messages: readonly ConversationMessage[],
  liveRuns: readonly RunState[],
  inputs: SentInputs,
  pending: { key: string; input: RunSessionInput } | null,
): ConversationTurn[] => {
  const turns: ConversationTurn[] = [];
  const byRunId = new Map<Uuid, ConversationTurn>();

  const turnFor = (runId: Uuid) => {
    let turn = byRunId.get(runId);
    if (!turn) {
      turn = { key: runId, runId, user: null, assistant: null };
      byRunId.set(runId, turn);
      turns.push(turn);
    }
    return turn;
  };

  for (const message of messages) {
    const turn = turnFor(message.runId);
    if (message.role === "user")
      turn.user = { text: message.user.text, latex: message.user.latex };
    else turn.assistant = { kind: "history", message };
  }

  for (const run of liveRuns) {
    if (run.runId === null) continue;
    const turn = turnFor(run.runId);
    const input =
      run.identity.requestId === null
        ? undefined
        : inputs.get(run.identity.requestId);
    // 이 화면(또는 홈)이 보낸 질문이면 접수 전 자리(requestId key)와 같은 key를 써 remount를 막는다.
    // 복원·409로 붙은 run은 접수 전 자리가 없었으므로 이력과 같은 runId key를 그대로 둔다.
    if (input && run.identity.requestId !== null)
      turn.key = run.identity.requestId;
    turn.assistant = { kind: "live", run };
    if (!turn.user && input) turn.user = toTurnUser(input);
  }

  if (pending)
    turns.push({
      key: pending.key,
      runId: null,
      user: toTurnUser(pending.input),
      assistant: { kind: "pending" },
    });

  return turns;
};

/** live run 목록에 run을 넣는다(같은 runId는 자리를 지키고 최신 state로 바꾼다). */
export const upsertLiveRun = (
  runs: readonly RunState[],
  run: RunState,
): RunState[] => {
  const index = runs.findIndex((item) => item.runId === run.runId);
  if (index < 0) return [...runs, run];
  const next = [...runs];
  next[index] = run;
  return next;
};
