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
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /** 뷰어용 File 객체 참조 (노트 생성 후 업로드) */
  const viewerFileRef = useRef<File | null>(null);

  const isSending = isCreatingNote || isUploading;

  const clearError = () => setUploadError(null);

  const handleSend = (data: ChatSendData) => {
    // 노트만 생성 (title은 서버가 자동 생성)
    createNote(
      {},
      {
        onSuccess: async (response) => {
          const newNoteId = response.result.noteId;
          setIsUploading(true);

          let uploadFailed = false;
          setUploadError(null);
          let uploadedCanvasImageIds: number[] = [];
          let uploadedFileAssetIds: number[] = [];

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

          navigate(`/app/chat/${newNoteId}`, {
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
