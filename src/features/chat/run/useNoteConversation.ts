import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ConversationMessage,
  NoteId,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import { RunApiError } from "@/features/run/api";
import { selectIsActive, selectIsTerminal } from "@/features/run/model";
import type { RunState } from "@/features/run/model";
import { useRunSession } from "@/features/run/session";
import { noteKeys } from "@/features/notes/hooks/useNotes";
import { creditKeys } from "@/features/settings/hooks/useCredit";
import { userKeys } from "@/features/settings/hooks/useUser";
import type {
  RunSessionInput,
  RunSessionSnapshot,
} from "@/features/run/session";
import {
  ACTIVE_RUN_CONFLICT_NOTICE,
  ATTACHMENT_NOTICE,
  RECONNECTING_NOTICE,
  describeProblem,
} from "./conversation_notice";
import type { ConversationNotice } from "./conversation_notice";
import { buildConversationTurns, upsertLiveRun } from "./conversation_turns";
import { useRunSessionRegistry } from "./run_session_registry";
import type { RunSessionHandoff } from "./run_session_registry";

/** 대화 조회 한 페이지 크기 */
export const CONVERSATION_PAGE_SIZE = 30;

export type HistoryState =
  | { status: "loading" }
  | {
      status: "ready";
      messages: ConversationMessage[];
      nextBefore: Uuid | null;
      loadingOlder: boolean;
    }
  | { status: "error"; notFound: boolean };

/**
 * 입력창 상태.
 * - `idle`: 보낼 수 있다
 * - `active`: Active Run(또는 접수 대기) — draft만 쓰고 정지 버튼을 보인다
 * - `canceling`: 정지 요청 중·CANCELING — "중단 중", 전송 불가
 */
export type ComposerPhase = "idle" | "active" | "canceling";

export interface ComposerState {
  phase: ComposerPhase;
  canStop: boolean;
  /** 요청 한도(Retry-After): 이 시각까지 전송을 막는다. 안내를 닫아도 유지된다. */
  blockedUntil: number | null;
  /**
   * `run.created` 전에 재접속이 멈췄다(접수됐을 수 있다). 새 질문은 새 requestId라 중복 run이 될 수 있으므로
   * "다시 연결"(같은 requestId)만 허용하고 전송을 막는다.
   */
  stalled: boolean;
}

/** 입력창에 되돌릴 질문. `id`가 바뀔 때마다 입력창 내용을 바꾼다. */
export interface DraftRestore {
  id: number;
  text: string;
}

export interface ConversationSendInput extends RunSessionInput {
  /** 첨부·#파일 멘션·@도구 (browser-run-v1 요청에 담을 수 없어 S09·S11 전까지 보내지 않는다) */
  hasUnsupportedParts?: boolean;
}

/** 연결 중(접수 대기 포함). `useHomeSend`의 대기 판정과 같다. */
const isConnected = (snapshot: RunSessionSnapshot) =>
  snapshot.connection === "connecting" ||
  snapshot.connection === "streaming" ||
  snapshot.connection === "backoff";

const STALL_KINDS = new Set(["reconnect_exhausted", "stream_rejected"]);

/** `run.created` 전 전송(draft가 아직 세션에 있다) */
const isUnaccepted = (snapshot: RunSessionSnapshot) =>
  snapshot.origin === "send" &&
  snapshot.run.runId === null &&
  snapshot.draft !== null;

/** 접수를 기다리는 중 */
const isInFlight = (snapshot: RunSessionSnapshot) =>
  isUnaccepted(snapshot) && isConnected(snapshot);

/** 접수 전에 재접속이 멈췄다 — "다시 연결"이 같은 requestId로 다시 보낸다. */
const isStalled = (snapshot: RunSessionSnapshot) =>
  isUnaccepted(snapshot) &&
  !isConnected(snapshot) &&
  !!snapshot.problem &&
  STALL_KINDS.has(snapshot.problem.kind);

/** 메시지를 messageId로 합쳐 createdAt 오름차순으로 둔다. */
const mergeMessages = (
  current: readonly ConversationMessage[],
  incoming: readonly ConversationMessage[],
) => {
  const byId = new Map(current.map((message) => [message.messageId, message]));
  for (const message of incoming) byId.set(message.messageId, message);
  return [...byId.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
};

const getComposerPhase = (snapshot: RunSessionSnapshot): ComposerPhase => {
  if (
    snapshot.cancel.phase === "requesting" ||
    snapshot.run.status === "CANCELING"
  )
    return "canceling";
  if (selectIsActive(snapshot.run) || isInFlight(snapshot)) return "active";
  return "idle";
};

/**
 * Note 화면의 대화: 이력 조회·run 세션 연결·전송·정지·draft (S08 ACT-03·RSP-02).
 *
 * - 진입 시 대화 조회 첫 페이지를 그리고 그 페이지로 `restore`한다(activeRun이 있으면 seq 1부터 이어 받는다).
 *   홈이 맡긴 첫 질문 세션이 있으면 그 세션을 그대로 쓴다(같은 stream).
 * - 화면을 떠나면 연결만 끊는다(run 취소 아님).
 * - 거부·409로 Server가 받지 않은 질문은 입력창으로 돌려준다. 어떤 경우에도 자동으로 다시 보내지 않는다.
 */
export const useNoteConversation = (noteId: NoteId) => {
  const registry = useRunSessionRegistry();
  const queryClient = useQueryClient();
  const [handoff] = useState<RunSessionHandoff>(
    () =>
      registry.peek(noteId) ?? {
        session: registry.create(noteId),
        inputs: new Map(),
      },
  );
  const { session } = handoff;
  const snapshot = useRunSession(session);

  const [inputs, setInputs] = useState(handoff.inputs);
  const [history, setHistory] = useState<HistoryState>({ status: "loading" });
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const [liveRuns, setLiveRuns] = useState<readonly RunState[]>([]);
  const [localNotice, setLocalNotice] = useState<ConversationNotice | null>(
    null,
  );
  const [draftRestore, setDraftRestore] = useState<DraftRestore | null>(null);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(
    null,
  );
  /** 마지막 전송의 requestId — 접수 전 자리와 접수 뒤 run 자리가 같은 key를 쓴다. */
  const [lastRequestId, setLastRequestId] = useState<Uuid | null>(null);

  // 세션의 run을 화면 목록에 남긴다(새 질문으로 세션 run이 바뀌어도 앞 run의 결과는 그대로 보인다).
  const currentRun = snapshot.run;
  if (currentRun.runId !== null && !liveRuns.includes(currentRun))
    setLiveRuns((prev) => upsertLiveRun(prev, currentRun));

  const restoreDraft = useCallback((text: string) => {
    setDraftRestore((prev) => ({ id: (prev?.id ?? 0) + 1, text }));
  }, []);

  /** 최신 페이지를 다시 읽어 이력에 합친다(409로 다른 탭의 질문에 붙었을 때 그 질문을 보이려고). */
  const refreshLatest = useCallback(async () => {
    try {
      const page = await registry.api.getConversationMessages(noteId, {
        limit: CONVERSATION_PAGE_SIZE,
      });
      setHistory((prev) =>
        prev.status === "ready"
          ? { ...prev, messages: mergeMessages(prev.messages, page.messages) }
          : prev,
      );
    } catch {
      // 이력 보강만 실패했다. 진행 중 답변은 세션이 계속 받는다.
    }
  }, [registry, noteId]);

  // Server가 받지 않은 질문을 입력창으로 돌려준다(접수 거부·409·Note 없음·계약 밖 오류). 자동 재전송은 없다.
  // 접수 전 재접속이 멈춘 경우는 돌려주지 않는다 — 접수됐을 수 있어 "다시 연결"(같은 requestId)로 잇는다.
  useEffect(() => {
    const handBack = () => {
      const current = session.getSnapshot();
      const { draft, problem } = current;
      if (!draft || isInFlight(current) || isStalled(current)) return;
      const conflict = current.origin === "active_run_conflict";
      if (!conflict && !problem) return;
      if (problem?.kind !== "invalid_request") restoreDraft(draft.text);
      if (conflict) {
        setLocalNotice(ACTIVE_RUN_CONFLICT_NOTICE);
        void refreshLatest();
      } else if (
        problem?.kind === "rejected" ||
        problem?.kind === "invalid_request"
      ) {
        setLocalNotice(describeProblem(problem));
        if (problem.kind === "rejected" && problem.retryAt !== null)
          setRetryBlockedUntil(problem.retryAt);
      }
      session.clearDraft();
    };
    handBack();
    return session.subscribe(handBack);
  }, [session, restoreDraft, refreshLatest]);

  // 세션 수명: 화면을 떠날 때 연결만 끊는다(run 취소 아님). 이력 재조회와 묶지 않는다.
  useEffect(() => {
    registry.release(noteId, handoff);
    return () => session.dispose();
  }, [registry, noteId, handoff, session]);

  // 진입·새로고침 복원. 이력 "다시 불러오기"도 이 effect를 다시 돌린다(진행 중 stream은 끊지 않는다).
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const page = await registry.api.getConversationMessages(
          noteId,
          { limit: CONVERSATION_PAGE_SIZE },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setHistory({
          status: "ready",
          messages: page.messages,
          nextBefore: page.nextBefore,
          loadingOlder: false,
        });
        void session.restore(page);
      } catch (error) {
        if (controller.signal.aborted) return;
        setHistory({
          status: "error",
          notFound: error instanceof RunApiError && error.code === "RUN4041",
        });
      }
    };
    void load();
    return () => controller.abort();
  }, [registry, noteId, session, historyAttempt]);

  // 접수(run.created)와 terminal 뒤 잔액·프로필·노트 제목·목록을 다시 읽는다(차감·제목은 Server가 한다).
  const runId = snapshot.run.runId;
  const isTerminal = selectIsTerminal(snapshot.run);
  useEffect(() => {
    if (runId === null) return;
    void queryClient.invalidateQueries({ queryKey: creditKeys.all });
    void queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    void queryClient.invalidateQueries({
      queryKey: [...noteKeys.all, "detail", noteId],
    });
    void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
  }, [queryClient, noteId, runId, isTerminal]);

  const retryHistory = useCallback(() => {
    setHistory({ status: "loading" });
    setHistoryAttempt((prev) => prev + 1);
  }, []);

  const nextBefore = history.status === "ready" ? history.nextBefore : null;
  const loadOlder = useCallback(async () => {
    if (nextBefore === null) return;
    setHistory((prev) =>
      prev.status === "ready" ? { ...prev, loadingOlder: true } : prev,
    );
    try {
      const page = await registry.api.getConversationMessages(noteId, {
        before: nextBefore,
        limit: CONVERSATION_PAGE_SIZE,
      });
      setHistory((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              messages: [...page.messages, ...prev.messages],
              nextBefore: page.nextBefore,
              loadingOlder: false,
            }
          : prev,
      );
    } catch {
      setHistory((prev) =>
        prev.status === "ready" ? { ...prev, loadingOlder: false } : prev,
      );
      setLocalNotice({
        key: "load_older_failed",
        tone: "error",
        title: "이전 대화를 불러오지 못했어요",
      });
    }
  }, [registry, noteId, nextBefore]);

  /** 새 질문. Server에 보냈으면 true(입력창을 비운다), 보내지 않았으면 false(입력창 유지). */
  const send = useCallback(
    ({ hasUnsupportedParts, ...input }: ConversationSendInput) => {
      if (hasUnsupportedParts) {
        setLocalNotice(ATTACHMENT_NOTICE);
        return false;
      }
      setLocalNotice(null);
      const result = session.send(input);
      if (!result.ok) return false;
      setInputs((prev) => new Map(prev).set(result.requestId, input));
      setLastRequestId(result.requestId);
      return true;
    },
    [session],
  );

  const stop = useCallback(() => {
    void session.cancel();
  }, [session]);

  const reconnect = useCallback(() => {
    session.reconnect();
  }, [session]);

  const turns = useMemo(
    () =>
      buildConversationTurns(
        history.status === "ready" ? history.messages : [],
        liveRuns,
        inputs,
        (isInFlight(snapshot) || isStalled(snapshot)) && snapshot.draft
          ? { key: lastRequestId ?? "pending", input: snapshot.draft }
          : null,
      ),
    [history, liveRuns, inputs, snapshot, lastRequestId],
  );

  const sessionNotice = snapshot.problem
    ? snapshot.problem.kind === "rejected" ||
      snapshot.problem.kind === "invalid_request"
      ? null // 입력창으로 돌려줄 때 localNotice로 옮겼다
      : describeProblem(snapshot.problem)
    : snapshot.connection === "backoff"
      ? RECONNECTING_NOTICE
      : null;
  const historyNotice: ConversationNotice | null =
    history.status !== "error"
      ? null
      : history.notFound
        ? {
            key: "history_not_found",
            tone: "error",
            title: "노트를 찾을 수 없어요",
            description: "노트가 삭제되었을 수 있어요.",
          }
        : {
            key: "history_failed",
            tone: "error",
            title: "대화를 불러오지 못했어요",
            action: "retry_history",
          };
  const notices = [
    historyNotice,
    localNotice && { ...localNotice, dismissible: true },
    sessionNotice,
  ].filter((notice): notice is ConversationNotice => notice !== null);

  const composer: ComposerState = {
    phase: getComposerPhase(snapshot),
    canStop: snapshot.canCancel,
    blockedUntil: retryBlockedUntil,
    stalled: isStalled(snapshot),
  };

  return {
    turns,
    history,
    loadOlder,
    retryHistory,
    notices,
    /** 화면 안내(거부·첨부 등)를 닫는다. 세션 상태 안내(연결·Note 없음)는 상태가 바뀌어야 사라진다. */
    dismissNotice: () => setLocalNotice(null),
    composer,
    send,
    stop,
    reconnect,
    draftRestore,
    restoreDraft,
    snapshot,
  };
};

export type NoteConversation = ReturnType<typeof useNoteConversation>;
