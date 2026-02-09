import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";
import { useCreateConversation } from "@/features/editor/hooks/useEditorQueries";
import { useNoteDetail } from "@/features/notes/hooks/useNotes";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { CreateNoteResponse } from "@/features/notes/api/notes_types";
import type { ConversationInfo } from "@/features/notes/api/notes_types";
import type { ChatMessage, MessageAttachment } from "../types/chat_types";

/** 서버 ConversationInfo[] → ChatMessage[] 변환 */
const convertConversations = (
  conversations: ConversationInfo[],
): ChatMessage[] =>
  conversations.flatMap((conv) => [
    {
      id: `msg-${conv.userMessage.messageId}`,
      role: "user" as const,
      content: conv.userMessage.content,
    },
    {
      id: `msg-${conv.assistantMessage.messageId}`,
      role: "assistant" as const,
      content: conv.assistantMessage.content,
    },
  ]);

/**
 * 채팅 메시지 상태 관리 훅
 *
 * - HomePage에서 전달된 첫 대화 데이터 or API 히스토리 로드
 * - 낙관적 UI 메시지 전송
 * - 첨부 파일 업로드 → API 호출
 */
export const useChatMessages = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  // ─── location.state에서 초기 데이터 추출 (ref로 보존) ───
  // setSearchParams 호출 시 location.state가 null로 초기화되므로
  // 최초 진입 시 ref에 저장하여 패널 토글 등에서도 데이터 유지
  const initialStateRef = useRef(location.state);

  const createNoteResponse = initialStateRef.current?.createNoteResponse as
    | CreateNoteResponse
    | undefined;

  const initialAttachments = useMemo(
    () => (initialStateRef.current?.attachments ?? []) as MessageAttachment[],
    [],
  );

  const viewerFile = initialStateRef.current?.viewerFile as
    | { name: string; mimeType: string; size: number }
    | undefined;

  const hasInitialData = !!createNoteResponse?.firstConversation;

  // ─── API 히스토리 로드 ───
  const { data: noteDetail, isLoading: isNoteLoading } = useNoteDetail(
    noteId,
    undefined,
    { enabled: !hasInitialData },
  );

  // ─── 메시지 상태 ───
  const initialMessages = useMemo((): ChatMessage[] => {
    if (createNoteResponse?.firstConversation) {
      const { userMessage, assistantMessage } =
        createNoteResponse.firstConversation;
      return [
        {
          id: `msg-${userMessage.messageId}`,
          role: "user",
          content: userMessage.content,
          attachments:
            initialAttachments.length > 0 ? initialAttachments : undefined,
        },
        {
          id: `msg-${assistantMessage.messageId}`,
          role: "assistant",
          content: assistantMessage.content,
        },
      ];
    }
    return [];
  }, [createNoteResponse, initialAttachments]);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // 서버 히스토리 머지 (로컬 메시지 보존)
  useEffect(() => {
    if (noteDetail?.conversations && !hasInitialData) {
      const reversed = [...noteDetail.conversations].reverse();
      const serverMessages = convertConversations(reversed);

      setMessages((prev) => {
        const serverIds = new Set(serverMessages.map((m) => m.id));
        const localOnly = prev.filter((m) => !serverIds.has(m.id));
        return [...serverMessages, ...localOnly];
      });
    }
  }, [noteDetail, hasInitialData]);

  // ─── 대화 생성 ───
  const { mutate: createConversation, isPending: isMutating } =
    useCreateConversation();
  const [isUploading, setIsUploading] = useState(false);
  const isSending = isMutating || isUploading;

  const handleSend = useCallback(
    async (data: ChatSendData) => {
      const nId = Number(noteId);
      if (!nId) return;

      // 1. 첨부 파일 업로드
      let uploadedFileAssetIds: number[] = [];
      let canvasImageIds: number[] = [];

      if (data.attachments.length > 0) {
        setIsUploading(true);
        try {
          const result = await uploadAttachments(nId, data.attachments);
          uploadedFileAssetIds = result.fileAssetIds;
          canvasImageIds = result.canvasAssetIds;
          queryClient.invalidateQueries({ queryKey: ["noteAssets", nId] });
        } catch (error) {
          console.error("[ChatPage] 첨부 파일 업로드 실패:", error);
          setIsUploading(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: "파일 업로드에 실패했습니다. 다시 시도해주세요.",
            },
          ]);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // 2. assetId 병합
      const allAssetIds = [...data.mentionedAssetIds, ...uploadedFileAssetIds];

      // 3. 낙관적 UI
      const messageAttachments: MessageAttachment[] | undefined =
        data.attachments.length > 0
          ? data.attachments.map((a) => ({
              name: a.name,
              mimeType: a.mimeType,
              size: a.size,
              previewUrl: a.previewUrl,
            }))
          : undefined;

      const tempUserMsgId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempUserMsgId,
          role: "user",
          content: data.message,
          attachments: messageAttachments,
        },
      ]);

      // 4. API 호출
      createConversation(
        {
          text: data.message,
          latex: data.latex,
          mentionedAssetIds: allAssetIds.length > 0 ? allAssetIds : undefined,
          chosenFeatures:
            data.mentionedToolCodes.length > 0
              ? data.mentionedToolCodes
              : undefined,
          canvasImageIds:
            canvasImageIds.length > 0 ? canvasImageIds : undefined,
        },
        {
          onSuccess: (response) => {
            const { userMessage, assistantMessage } = response.result;
            setMessages((prev) => [
              ...prev.map((m) =>
                m.id === tempUserMsgId
                  ? {
                      id: `msg-${userMessage.messageId}`,
                      role: "user" as const,
                      content: userMessage.content,
                      attachments: messageAttachments,
                    }
                  : m,
              ),
              {
                id: `msg-${assistantMessage.messageId}`,
                role: "assistant",
                content: assistantMessage.content,
              },
            ]);
          },
          onError: (error) => {
            console.error("대화 생성 실패:", error);
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== tempUserMsgId),
              {
                id: `error-${Date.now()}`,
                role: "assistant",
                content:
                  "죄송합니다. 응답을 생성하지 못했습니다. 다시 시도해주세요.",
              },
            ]);
          },
        },
      );
    },
    [noteId, createConversation, queryClient],
  );

  // ─── 파생 데이터 ───
  const noteTitle =
    createNoteResponse?.title ?? noteDetail?.title ?? `노트 ${noteId}`;

  return {
    noteId,
    messages,
    handleSend,
    isSending,
    isNoteLoading: isNoteLoading && !hasInitialData,
    noteTitle,
    noteDetail,
    viewerFile,
    hasInitialData,
  };
};
