import { ChatInput } from "@/features/editor/components/ChatInput";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import {
  ACTIVE_RUN_INPUT_HINT,
  CANCELING_BUTTON_TEXT,
  STOP_BUTTON_LABEL,
} from "../../run/conversation_notice";
import type { NoteConversation } from "../../run/useNoteConversation";
import { useRetryCountdown } from "../../run/useRetryCountdown";
import { ConversationMessages } from "./ConversationMessages";
import { ConversationNotices } from "./ConversationNotices";

interface ConversationPanelProps {
  conversation: NoteConversation;
  /** #파일 멘션용 Note 번호(구형 자산 API) */
  noteNumber: number | null;
}

/**
 * Note 대화 오른쪽 패널 — 대화 목록·안내·입력창 (S08)
 *
 * 입력창은 Active Run 동안 draft만 쓰고 정지 버튼을 보인다. CANCELING이면 "중단 중"으로 전송을 막는다.
 */
export const ConversationPanel = ({
  conversation,
  noteNumber,
}: ConversationPanelProps) => {
  const {
    turns,
    history,
    loadOlder,
    retryHistory,
    notices,
    dismissNotice,
    composer,
    send,
    stop,
    reconnect,
    draftRestore,
    restoreDraft,
  } = conversation;
  const blockedSeconds = useRetryCountdown(composer.blockedUntil);

  const handleSend = (data: ChatSendData) =>
    send({
      text: data.message,
      latex: data.latex ?? null,
      hasAttachments: data.attachments.length > 0,
    });

  return (
    <div className="flex h-full flex-col bg-[#F1F4F8]">
      <div className="min-h-0 flex-1 overflow-hidden">
        <ConversationMessages
          turns={turns}
          history={history}
          onLoadOlder={() => void loadOlder()}
          onRefill={restoreDraft}
        />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-[8px] px-[16px] pb-[20px]">
        <ConversationNotices
          notices={notices}
          onReconnect={reconnect}
          onRetryHistory={retryHistory}
          onDismiss={dismissNotice}
          className="max-w-[660px]"
        />
        <ChatInput
          noteId={noteNumber}
          onSend={handleSend}
          runControl={{
            phase: composer.phase,
            canStop: composer.canStop,
            onStop: stop,
            label: STOP_BUTTON_LABEL,
            cancelingText: CANCELING_BUTTON_TEXT,
            activeHint: ACTIVE_RUN_INPUT_HINT,
          }}
          isSendBlocked={blockedSeconds > 0}
          draftRestore={draftRestore}
        />
      </div>
    </div>
  );
};
