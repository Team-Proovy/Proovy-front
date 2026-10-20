import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useNoteList, noteKeys } from "@/features/notes/hooks/useNotes";
import { useMyProfile } from "@/features/settings/hooks/useUser";
import {
  getPlanMaxNotes,
  normalizePlanType,
} from "@/features/subscription/types/plan_types";
import { useAuthStore } from "@/features/auth/store/auth_store";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { MessageAttachment } from "@/features/chat/types/chat_types";
import type {
  RunSession,
  RunSessionInput,
  RunSessionSnapshot,
} from "@/features/run/session";
import type { Uuid } from "@/shared/contracts/browser_run_v1";
import { useRunSessionRegistry } from "@/features/chat/run/run_session_registry";
import {
  ATTACHMENT_NOTICE,
  HOME_STALLED_NOTICE,
  describeProblem,
  hasUnsupportedParts,
} from "@/features/chat/run/conversation_notice";
import type { ConversationNotice } from "@/features/chat/run/conversation_notice";
import { showErrorToast, showToast } from "@/shared/lib/toast";

/**
 * 구형 첫 대화 데이터 (location.state). 새 경로는 쓰지 않는다 — 구형 `useChatMessages`가 남아 있는 동안만 둔다(1.95 삭제).
 */
export interface FirstMessageState {
  text: string;
  latex?: string;
  mentionedAssetIds: number[];
  chosenFeatures: string[];
  canvasImageIds: number[];
  attachments: MessageAttachment[];
  pendingAttachments?: ChatSendData["attachments"];
  viewerFile?: { name: string; mimeType: string; size: number };
  pendingViewerFile?: File;
}

interface WaitingSend {
  session: RunSession;
  requestId: Uuid;
  input: RunSessionInput;
}

const toHandoff = ({ session, requestId, input }: WaitingSend) => ({
  session,
  inputs: new Map([[requestId, input]]),
});

const isConnected = (snapshot: RunSessionSnapshot) =>
  snapshot.connection === "connecting" ||
  snapshot.connection === "streaming" ||
  snapshot.connection === "backoff";

const VIEWER_FILE_NOT_SENT_TEXT =
  "뷰어 파일은 아직 질문과 함께 올라가지 않아요. 질문만 먼저 보냈어요.";

/**
 * HomePage 첫 질문 전송 (S08)
 *
 * Note를 먼저 만들지 않는다. noteId 없이 `POST /api/conversations` 한 번으로 보내고, Server가 같은 접수
 * transaction에서 Note를 만든다. `run.created`의 noteId로 Note 화면에 가며, 세션을 registry에 맡겨
 * 같은 stream을 이어 받게 한다. 제목 생성·크레딧 차감은 Front가 호출하지 않는다(Server 책임).
 *
 * 접수가 거부되면(요청 한도·잔액 부족 등) 이동하지 않고 안내를 보이며 입력창 내용을 남긴다.
 */
export const useHomeSend = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const registry = useRunSessionRegistry();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const authUser = useAuthStore((state) => state.user);
  const { data: noteListData } = useNoteList({
    page: 0,
    size: 1,
  });

  /** 뷰어용 File 객체 참조 (뷰어 업로드 연동은 S09) */
  const viewerFileRef = useRef<File | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<ConversationNotice | null>(null);
  /** 요청 한도(Retry-After): 안내를 닫아도 이 시각까지 전송을 막는다. */
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(
    null,
  );
  /** 접수 전에 재접속이 멈췄다. "다시 연결"(같은 requestId)만 허용하고 새 전송을 막는다(중복 run 방지). */
  const [isStalled, setIsStalled] = useState(false);
  /** `run.created`를 기다리는(또는 기다리다 멈춘) 전송 */
  const waitingRef = useRef<WaitingSend | null>(null);
  /** 홈 화면의 접수 대기 구독을 끊는다(이동·handOff는 홈이 보일 때만 한다). */
  const stopCheckRef = useRef<(() => void) | null>(null);

  // `run.created` 전에 홈을 떠나도 접수됐을 수 있는 run을 버리지 않는다: 연결을 유지해 접수되면
  // registry에 맡기고(그 Note에 들어가면 이어 받는다) 노트 목록을 다시 읽는다. 멈춰 있었으면 연결만 정리한다.
  // 홈의 접수 대기 구독은 먼저 끊는다 — 사용자가 간 화면을 그 Note로 바꾸지 않는다.
  useEffect(
    () => () => {
      stopCheckRef.current?.();
      stopCheckRef.current = null;
      const waiting = waitingRef.current;
      waitingRef.current = null;
      if (!waiting) return;
      const { session } = waiting;
      const finish = () => {
        const snapshot = session.getSnapshot();
        if (snapshot.noteId !== null) {
          unsubscribe();
          registry.handOff(snapshot.noteId, toHandoff(waiting), {
            detached: true,
          });
          void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
        } else if (!isConnected(snapshot)) {
          unsubscribe();
          session.dispose();
          void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
        }
      };
      const unsubscribe = session.subscribe(finish);
      finish();
    },
    [registry, queryClient],
  );

  const isOverNoteLimit = () => {
    const totalNotes = noteListData?.pageInfo.totalElements ?? 0;
    const resolvedPlan = profile?.subscription?.plan ?? authUser?.plan;
    const shouldCheckLimit = !isProfileLoading || !!resolvedPlan;
    if (!shouldCheckLimit) return false;

    const maxNotes = getPlanMaxNotes(resolvedPlan);
    if (totalNotes < maxNotes) return false;
    showErrorToast(
      normalizePlanType(resolvedPlan) === "Pro"
        ? "최대 노트를 모두 생성하여 더 이상 노트를 만들 수 없습니다."
        : "노트 생성 개수가 초과하였습니다. 플랜을 업그레이드 해주세요.",
    );
    return true;
  };

  /**
   * `run.created`까지 기다린다. 접수되면 세션을 맡기고 Note 화면으로 간다(true).
   * 거부되면 안내하고 세션을 정리한다(false, 입력창 유지). 접수 전 재접속이 멈추면 세션을 남겨 "다시 연결"을 기다린다.
   */
  const waitForAcceptance = (waiting: WaitingSend) => {
    const { session } = waiting;
    waitingRef.current = waiting;
    setIsSending(true);
    return new Promise<boolean>((resolve) => {
      const settle = (accepted: boolean) => {
        unsubscribe();
        stopCheckRef.current = null;
        setIsSending(false);
        resolve(accepted);
      };
      const check = () => {
        const snapshot = session.getSnapshot();
        if (snapshot.noteId !== null) {
          waitingRef.current = null;
          registry.handOff(snapshot.noteId, toHandoff(waiting));
          settle(true);
          if (viewerFileRef.current)
            showToast({ message: VIEWER_FILE_NOT_SENT_TEXT });
          void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
          navigate(`/app/chat/${snapshot.noteId}`);
          return;
        }
        const { problem } = snapshot;
        if (!problem || isConnected(snapshot)) return;
        if (
          problem.kind === "reconnect_exhausted" ||
          problem.kind === "stream_rejected"
        ) {
          // 접수됐을 수 있다. 새 requestId로 다시 보내면 Note·run이 하나 더 생길 수 있으므로 세션을 남긴다.
          setNotice(HOME_STALLED_NOTICE);
          setIsStalled(true);
          settle(false);
          return;
        }
        // 접수 거부 등. 이동하지 않고 안내한다. 다시 보내는 것은 사용자다.
        waitingRef.current = null;
        setNotice(describeProblem(problem));
        if (problem.kind === "rejected" && problem.retryAt !== null)
          setRetryBlockedUntil(problem.retryAt);
        session.dispose();
        settle(false);
      };
      const unsubscribe = session.subscribe(check);
      stopCheckRef.current = () => {
        unsubscribe();
        resolve(false);
      };
      check();
    });
  };

  /** 접수되어 Note 화면으로 갔으면 true(입력창을 비운다), 아니면 false(입력창 유지). */
  const handleSend = (data: ChatSendData): Promise<boolean> => {
    if (waitingRef.current) return Promise.resolve(false);
    if (hasUnsupportedParts(data)) {
      setNotice(ATTACHMENT_NOTICE);
      return Promise.resolve(false);
    }
    if (isOverNoteLimit()) return Promise.resolve(false);

    const input: RunSessionInput = {
      text: data.message,
      latex: data.latex ?? null,
    };
    const session = registry.create();
    const result = session.send(input);
    if (!result.ok) {
      const problem = session.getSnapshot().problem;
      setNotice(problem && describeProblem(problem));
      session.dispose();
      return Promise.resolve(false);
    }

    setNotice(null);
    return waitForAcceptance({ session, requestId: result.requestId, input });
  };

  /** 접수 전 멈춘 전송을 같은 requestId로 다시 잇는다(새 질문이 아니다). */
  const reconnect = () => {
    const waiting = waitingRef.current;
    if (!waiting || !isStalled) return;
    setIsStalled(false);
    setNotice(null);
    if (waiting.session.reconnect()) void waitForAcceptance(waiting);
  };

  return {
    viewerFileRef,
    isSending,
    handleSend,
    notice,
    dismissNotice: () => setNotice(null),
    reconnect,
    retryBlockedUntil,
    isStalled,
  };
};
