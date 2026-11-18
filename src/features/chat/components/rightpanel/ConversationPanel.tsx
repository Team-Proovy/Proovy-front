import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatInput } from "@/features/editor/components/ChatInput";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { Attachment } from "@/features/editor/hooks/useAttachments";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
import { resolveUploadErrorMessage } from "@/features/assets/utils/uploadErrorMessage";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import { showErrorToast } from "@/shared/lib/toast";
import {
  ACTIVE_RUN_INPUT_HINT,
  CANCELING_BUTTON_TEXT,
  STOP_BUTTON_LABEL,
} from "../../run/conversation_notice";
import type { NoteConversation } from "../../run/useNoteConversation";
import { useRetryCountdown } from "../../run/useRetryCountdown";
import { ConversationMessages } from "./ConversationMessages";
import { ConversationNotices } from "./ConversationNotices";

const parsePositiveAssetId = (
  raw: string | number | null | undefined,
): number | null => {
  if (raw == null) return null;
  const parsed =
    typeof raw === "number" ? raw : /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toUploadableFile = (attachment: Attachment): File | null => {
  if (attachment.file) return attachment.file;
  if (attachment.type === "canvas" && attachment.blob) {
    const mimeType =
      attachment.blob.type && attachment.blob.type.startsWith("image/")
        ? attachment.blob.type
        : "image/png";
    const fileName =
      attachment.name && /\.(png|jpe?g|webp|pdf)$/i.test(attachment.name)
        ? attachment.name
        : `canvas_${Date.now()}.png`;
    return new File([attachment.blob], fileName, { type: mimeType });
  }
  return null;
};

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
  const [searchParams] = useSearchParams();
  const viewerFileId = useStorageStore((s) => s.viewerFileId);
  const viewerPage = useStorageStore((s) => s.viewerPage);
  const viewerReady = useStorageStore((s) => s.viewerReady);
  const { uploadAsset } = useAssetUpload();
  const blockedSeconds = useRetryCountdown(composer.blockedUntil);
  const activeNoteRef = useRef<number | null>(noteNumber);

  useEffect(() => {
    activeNoteRef.current = noteNumber;
    return () => {
      activeNoteRef.current = null;
    };
  }, [noteNumber]);

  const handleSend = async (data: ChatSendData): Promise<boolean> => {
    const validNoteId =
      noteNumber != null && Number.isInteger(noteNumber) && noteNumber > 0
        ? noteNumber
        : null;
    const allowLocalPhotoFallback =
      import.meta.env.VITE_ENABLE_LOCAL_PHOTO_FALLBACK === "true";
    const uploadableFile =
      allowLocalPhotoFallback &&
      data.attachments.length === 1 &&
      data.mentionedAssetIds.length === 0 &&
      data.mentionedToolCodes.length === 0 &&
      validNoteId !== null
        ? toUploadableFile(data.attachments[0])
        : null;
    const unsupported =
      data.mentionedAssetIds.length > 0 ||
      data.mentionedToolCodes.length > 0 ||
      data.attachments.length > 1 ||
      (data.attachments.length === 1 && uploadableFile === null);

    if (unsupported) {
      return send({
        text: data.message,
        latex: data.latex ?? null,
        hasUnsupportedParts: true,
      });
    }

    if (uploadableFile && validNoteId !== null) {
      let uploadedAssetId: number;
      try {
        const uploaded = await uploadAsset(validNoteId, uploadableFile);
        uploadedAssetId = uploaded.assetId;
      } catch (error) {
        if (activeNoteRef.current === validNoteId) {
          showErrorToast(resolveUploadErrorMessage(error));
        }
        return false;
      }
      if (activeNoteRef.current !== validNoteId) {
        return false;
      }
      return send({
        text: data.message,
        latex: data.latex ?? null,
        viewerFocus: { noteAssetId: String(uploadedAssetId), page: 1 },
      });
    }

    const isStorageTab = searchParams.get("panel") === "storage";
    const urlAssetId = parsePositiveAssetId(searchParams.get("file"));
    const storeAssetId = parsePositiveAssetId(viewerFileId);
    const viewerMatches =
      !isStorageTab &&
      viewerReady &&
      storeAssetId !== null &&
      (urlAssetId === null || urlAssetId === storeAssetId);

    return send({
      text: data.message,
      latex: data.latex ?? null,
      ...(viewerMatches && {
        viewerFocus: {
          noteAssetId: String(storeAssetId),
          page: Math.max(1, viewerPage || 1),
        },
      }),
    });
  };

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
          isSendBlocked={blockedSeconds > 0 || composer.stalled}
          draftRestore={draftRestore}
        />
      </div>
    </div>
  );
};
