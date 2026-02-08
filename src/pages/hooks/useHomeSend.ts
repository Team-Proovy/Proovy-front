import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateNote } from "@/features/notes/hooks/useNotes";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import {
  getUploadUrl,
  uploadToS3,
  confirmUpload,
} from "@/features/assets/api/assetApi";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { MessageAttachment } from "@/features/chat/types/chat_types";

/**
 * HomePage 전송 로직 훅
 *
 * 1. 노트 생성 (firstMessage)
 * 2. 뷰어 파일 업로드 (presigned → S3 → confirm)
 * 3. ChatInput 첨부파일 업로드
 * 4. ChatPage로 네비게이션
 */
export const useHomeSend = () => {
  const navigate = useNavigate();
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /** 뷰어용 File 객체 참조 (노트 생성 후 업로드) */
  const viewerFileRef = useRef<File | null>(null);

  const isSending = isCreatingNote || isUploading;

  const clearError = () => setUploadError(null);

  const handleSend = (data: ChatSendData) => {
    createNote(
      {
        firstMessage: data.message,
        mentionedAssetIds:
          data.mentionedAssetIds.length > 0
            ? data.mentionedAssetIds
            : undefined,
        mentionedToolCodes:
          data.mentionedToolCodes.length > 0
            ? data.mentionedToolCodes
            : undefined,
      },
      {
        onSuccess: async (response) => {
          const newNoteId = response.result.noteId;
          setIsUploading(true);

          let uploadFailed = false;
          setUploadError(null);

          try {
            // 1. 뷰어 파일 업로드
            if (viewerFileRef.current) {
              const file = viewerFileRef.current;
              try {
                const { result } = await getUploadUrl({
                  noteId: newNoteId,
                  fileName: file.name,
                  mimeType: file.type,
                  fileSize: file.size,
                });
                await uploadToS3(result.uploadUrl, file);
                await confirmUpload(result.assetId);
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
                await uploadAttachments(newNoteId, data.attachments);
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

          // 첨부파일 정보 → ChatPage 전달
          const attachmentInfos: MessageAttachment[] = data.attachments.map(
            (a) => ({
              name: a.name,
              mimeType: a.mimeType,
              size: a.size,
              previewUrl: a.previewUrl,
            }),
          );

          const viewerFileInfo = viewerFileRef.current
            ? {
                name: viewerFileRef.current.name,
                mimeType: viewerFileRef.current.type,
                size: viewerFileRef.current.size,
              }
            : undefined;

          navigate(`/app/chat/${newNoteId}`, {
            state: {
              createNoteResponse: response.result,
              attachments: attachmentInfos,
              viewerFile: viewerFileInfo,
            },
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
