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
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import { resolveUploadMimeType } from "@/features/assets/utils/fileValidation";
import {
  getUploadUrl,
  uploadToS3,
  confirmUpload,
} from "@/features/assets/api/assetApi";
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
  /** 뷰어 파일 정보 (좌측 패널 표시용, API 필드 아님) */
  viewerFile?: { name: string; mimeType: string; size: number };
}

/**
 * HomePage 전송 로직 훅
 *
 * 1. 노트 생성 (POST /api/notes — 노트 리소스만 생성)
 * 2. 뷰어 파일 업로드 (presigned → S3 → confirm)
 * 3. ChatInput 첨부파일 업로드
 * 4. ChatPage로 네비게이션 (첫 메시지 데이터를 state로 전달)
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /** 뷰어용 File 객체 참조 (노트 생성 후 업로드) */
  const viewerFileRef = useRef<File | null>(null);

  const isSending = isCreatingNote || isUploading;

  const clearError = () => setUploadError(null);

  const handleSend = (data: ChatSendData) => {
    const totalNotes = noteListData?.pageInfo.totalElements ?? 0;
    const resolvedPlan = profile?.subscription?.plan ?? authUser?.plan;
    const shouldCheckLimit = !isProfileLoading || !!resolvedPlan;

    if (shouldCheckLimit) {
      const maxNotes = getPlanMaxNotes(resolvedPlan);

      if (totalNotes >= maxNotes) {
        setUploadError(
          "노트 생성 개수가 초과하였습니다. 플랜을 업그레이드 해주세요.",
        );
        return;
      }
    }

    // 노트만 생성 (title은 서버가 자동 생성)
    createNote(
      {},
      {
        onSuccess: async (response) => {
          const newNoteId = response.result.noteId;
          setIsUploading(true);

          let uploadFailed = false;
          let uploadedAssetId: number | undefined;
          setUploadError(null);
          let uploadedCanvasImageIds: number[] = [];
          let uploadedFileAssetIds: number[] = [];

          try {
            // 1. 뷰어 파일 업로드

            if (viewerFileRef.current) {
              const file = viewerFileRef.current;
              try {
                const mimeType = resolveUploadMimeType(file);
                if (!mimeType) {
                  throw new Error("지원하지 않는 파일 형식");
                }
                const { result } = await getUploadUrl({
                  noteId: newNoteId,
                  fileName: file.name,
                  mimeType,
                  fileSize: file.size,
                });
                await uploadToS3(result.uploadUrl, file, mimeType);
                await confirmUpload(result.assetId);
                uploadedAssetId = result.assetId;
              } catch (error) {
                console.error("[HomePage] 뷰어 파일 업로드 실패:", error);
                setUploadError(
                  "파일 업로드에 실패했습니다. 다시 시도해주세요.",
                );
                uploadFailed = true;
              }
            }

            // 2. ChatInput 첨부 파일 업로드
            if (!uploadFailed && data.attachments.length > 0) {
              try {
                const uploadResult = await uploadAttachments(
                  newNoteId,
                  data.attachments,
                );
                uploadedFileAssetIds = uploadResult.fileAssetIds;
                uploadedCanvasImageIds = uploadResult.canvasAssetIds;
              } catch (error) {
                console.error("[HomePage] 첨부 파일 업로드 실패:", error);
                setUploadError(
                  "첨부 파일 업로드에 실패했습니다. 다시 시도해주세요.",
                );
                uploadFailed = true;
              }
            }
          } finally {
            setIsUploading(false);
          }

          if (uploadFailed) return;

          // 저장소/노트 캐시 즉시 무효화 (홈 업로드 후 저장소 페이지 동기화 지연 방지)
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: noteKeys.lists() }),
            queryClient.invalidateQueries({
              queryKey: noteKeys.detail(String(newNoteId)),
            }),
            queryClient.invalidateQueries({ queryKey: assetKeys.storage }),
          ]);

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

          // 업로드된 파일이 있으면 뷰어 패널 열기 query param 추가
          const queryParams = new URLSearchParams();
          if (uploadedAssetId) {
            queryParams.set("panel", "viewer");
            queryParams.set("file", String(uploadedAssetId));
          }

          // 첫 메시지 데이터를 state로 전달 → ChatPage에서 conversations API 호출
          const firstMessage: FirstMessageState = {
            text: data.message,
            latex: data.latex,
            mentionedAssetIds: [
              ...data.mentionedAssetIds,
              ...uploadedFileAssetIds,
            ],
            chosenFeatures: data.mentionedToolCodes,
            canvasImageIds: uploadedCanvasImageIds,
            attachments: attachmentInfos,
            viewerFile: viewerFileInfo,
          };

          const queryString = queryParams.toString();
          const path = queryString
            ? `/app/chat/${newNoteId}?${queryString}`
            : `/app/chat/${newNoteId}`;

          navigate(path, {
            state: { firstMessage },
          });
        },
        onError: (error) => {
          console.error("노트 생성 실패:", error);
          setUploadError("노트 생성에 실패했습니다. 다시 시도해주세요.");
        },
      },
    );
  };

  return {
    viewerFileRef,
    isSending,
    uploadError,
    clearError,
    handleSend,
  };
};
