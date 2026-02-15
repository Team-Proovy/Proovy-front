import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  useCreateNote,
  useNoteList,
  noteKeys,
} from "@/features/notes/hooks/useNotes";
import { useMyProfile } from "@/features/settings/hooks/useUser";
import { getPlanMaxNotes } from "@/features/subscription/types/plan_types";
import { useAuthStore } from "@/features/auth/store/auth_store";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { MessageAttachment } from "@/features/chat/types/chat_types";
import { assetKeys } from "@/features/storage/hooks/useAssets";

const createPersistentPreviewUrl = (
  attachment: ChatSendData["attachments"][number],
): string | undefined => {
  if (attachment.type === "canvas" && attachment.blob) {
    return URL.createObjectURL(attachment.blob);
  }
  if (attachment.mimeType.startsWith("image/") && attachment.file) {
    return URL.createObjectURL(attachment.file);
  }
  return attachment.previewUrl;
};

/** ChatPage로 전달하는 첫 대화 데이터 (location.state) */
export interface FirstMessageState {
  /** 사용자 질문/지시문 (ConversationRequest.text) */
  text: string;
  /** LaTeX 수식 입력 */
  latex?: string;
  /** 언급된 자산 ID 목록 */
  mentionedAssetIds: number[];
  /** 선택된 기능 목록 (ConversationRequest.chosenFeatures) */
  chosenFeatures: string[];
  /** 캔버스 이미지 ID 목록 */
  canvasImageIds: number[];
  /** 첨부 파일 정보 (UI 표시용, API 필드 아님) */
  attachments: MessageAttachment[];
  /** 업로드 전 원본 첨부 데이터 (채팅방 진입 후 백그라운드 업로드용) */
  pendingAttachments?: ChatSendData["attachments"];
  /** 뷰어 파일 정보 (좌측 패널 표시용, API 필드 아님) */
  viewerFile?: { name: string; mimeType: string; size: number };
  /** 업로드 전 뷰어 파일 (채팅방 진입 후 백그라운드 업로드용) */
  pendingViewerFile?: File;
}

/**
 * HomePage 전송 로직 훅
 *
 * 1. 노트 생성 (POST /api/notes — 노트 리소스만 생성)
 * 2. ChatPage로 즉시 네비게이션 (첫 메시지 데이터 + 업로드 대기 데이터 전달)
 * 3. 실제 첨부 업로드/첫 대화 전송은 ChatPage에서 백그라운드 처리
 *    → ChatPage에서 POST /api/conversations 호출하여 AI 응답 수신
 */
export const useHomeSend = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const authUser = useAuthStore((state) => state.user);
  const { data: noteListData } = useNoteList({
    page: 0,
    size: 1,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  /** 뷰어용 File 객체 참조 (노트 생성 후 업로드) */
  const viewerFileRef = useRef<File | null>(null);

  const isSending = isCreatingNote;

  const clearError = () => setUploadError(null);

  const handleSend = (data: ChatSendData): boolean => {
    const totalNotes = noteListData?.pageInfo.totalElements ?? 0;
    const resolvedPlan = profile?.subscription?.plan ?? authUser?.plan;
    const shouldCheckLimit = !isProfileLoading || !!resolvedPlan;

    if (shouldCheckLimit) {
      const maxNotes = getPlanMaxNotes(resolvedPlan);

      if (totalNotes >= maxNotes) {
        setUploadError(
          "노트 생성 개수가 초과하였습니다. 플랜을 업그레이드 해주세요.",
        );
        return false;
      }
    }

    // 노트만 생성 (title은 서버가 자동 생성)
    createNote(
      {},
      {
        onSuccess: (response) => {
          const newNoteId = response.result.noteId;
          setUploadError(null);

          // 첨부파일 정보 → ChatPage 전달
          const attachmentInfos: MessageAttachment[] = data.attachments.map(
            (a) => ({
              name: a.name,
              mimeType: a.mimeType,
              size: a.size,
              previewUrl: createPersistentPreviewUrl(a),
            }),
          );

          const viewerFileInfo = viewerFileRef.current
            ? {
                name: viewerFileRef.current.name,
                mimeType: viewerFileRef.current.type,
                size: viewerFileRef.current.size,
              }
            : undefined;

          // 첫 메시지 데이터를 state로 전달 → ChatPage에서 conversations API 호출
          const firstMessage: FirstMessageState = {
            text: data.message,
            latex: data.latex,
            mentionedAssetIds: data.mentionedAssetIds,
            chosenFeatures: data.mentionedToolCodes,
            canvasImageIds: [],
            attachments: attachmentInfos,
            pendingAttachments: data.attachments,
            viewerFile: viewerFileInfo,
            pendingViewerFile: viewerFileRef.current ?? undefined,
          };

          navigate(`/app/chat/${newNoteId}`, {
            state: { firstMessage },
          });

          // 저장소/노트 캐시는 네비게이션을 막지 않도록 백그라운드에서 무효화
          void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
          void queryClient.invalidateQueries({
            queryKey: noteKeys.detail(String(newNoteId)),
          });
          void queryClient.invalidateQueries({ queryKey: assetKeys.storage });
        },
        onError: (error) => {
          console.error("노트 생성 실패:", error);
          setUploadError("노트 생성에 실패했습니다. 다시 시도해주세요.");
        },
      },
    );

    return true;
  };

  return {
    viewerFileRef,
    isSending,
    uploadError,
    clearError,
    handleSend,
  };
};
