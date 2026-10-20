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
import type { RunSession, RunSessionInput } from "@/features/run/session";
import { useRunSessionRegistry } from "@/features/chat/run/run_session_registry";
import {
  ATTACHMENT_NOTICE,
  describeProblem,
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
  /** `run.created`를 기다리는 세션. 홈을 떠나면 연결만 끊는다(run 취소 아님). */
  const waitingRef = useRef<RunSession | null>(null);

  useEffect(
    () => () => {
      waitingRef.current?.dispose();
      waitingRef.current = null;
    },
    [],
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

  /** 접수되어 Note 화면으로 갔으면 true(입력창을 비운다), 아니면 false(입력창 유지). */
  const handleSend = (data: ChatSendData): Promise<boolean> => {
    if (waitingRef.current) return Promise.resolve(false);
    if (data.attachments.length > 0) {
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
    setIsSending(true);
    waitingRef.current = session;

    return new Promise<boolean>((resolve) => {
      const settle = (accepted: boolean) => {
        unsubscribe();
        waitingRef.current = null;
        setIsSending(false);
        resolve(accepted);
      };
      const check = () => {
        const snapshot = session.getSnapshot();
        if (snapshot.noteId !== null) {
          const noteId = snapshot.noteId;
          registry.handOff(noteId, {
            session,
            inputs: new Map([[result.requestId, input]]),
          });
          settle(true);
          if (viewerFileRef.current)
            showToast({ message: VIEWER_FILE_NOT_SENT_TEXT });
          void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
          navigate(`/app/chat/${noteId}`);
          return;
        }
        // 접수 전에 멈췄다(거부·재시도 소진 등). 이동하지 않고 안내한다. 다시 보내는 것은 사용자다.
        const waiting =
          snapshot.connection === "connecting" ||
          snapshot.connection === "streaming" ||
          snapshot.connection === "backoff";
        if (snapshot.problem && !waiting) {
          setNotice(describeProblem(snapshot.problem));
          session.dispose();
          settle(false);
        }
      };
      const unsubscribe = session.subscribe(check);
      check();
    });
  };

  return {
    viewerFileRef,
    isSending,
    handleSend,
    notice,
    dismissNotice: () => setNotice(null),
  };
};
