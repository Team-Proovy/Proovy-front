import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";
import {
  createConversation as createConversationApi,
  parseSSEStream,
} from "@/features/editor/api/editor_api";
import { useNoteDetail } from "@/features/notes/hooks/useNotes";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { ConversationInfo } from "@/features/notes/api/notes_types";
import type { FirstMessageState } from "@/pages/hooks/useHomeSend";
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
 * - HomePage에서 전달된 첫 메시지 → POST /api/conversations 호출
 * - 기존 채팅방 재진입 시 API 히스토리 로드
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

  const firstMessageData = initialStateRef.current?.firstMessage as
    | FirstMessageState
    | undefined;

  const viewerFile = firstMessageData?.viewerFile;

  const hasFirstMessage = !!firstMessageData;

  // ─── 노트 상세 로드 (제목·메타데이터 + 재진입 시 히스토리) ───
  const { data: noteDetail, isLoading: isNoteLoading } = useNoteDetail(noteId);

  // ─── 메시지 상태 ───
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 서버 히스토리 머지 (재진입 시)
  useEffect(() => {
    if (noteDetail?.conversations && !hasFirstMessage) {
      const reversed = [...noteDetail.conversations].reverse();
      const serverMessages = convertConversations(reversed);

      setMessages((prev) => {
        const serverIds = new Set(serverMessages.map((m) => m.id));
        const localOnly = prev.filter((m) => !serverIds.has(m.id));
        return [...serverMessages, ...localOnly];
      });
    }
  }, [noteDetail, hasFirstMessage]);

  // ─── 스트리밍 상태 관리 ───
  const [isUploading, setIsUploading] = useState(false);
  const [isFirstMessageSending, setIsFirstMessageSending] = useState(false);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSending = isStreamingResponse || isUploading || isFirstMessageSending;

  // 컴포넌트 언마운트 시 스트리밍 중단
  // useEffect(() => {
  //   return () => {
  //     abortControllerRef.current?.abort();
  //   };
  // }, []);

  /** SSE 스트림을 파싱하여 메시지 상태를 실시간 업데이트 */
  const processStream = useCallback(
    async (response: Response, tempAssistantMsgId: string) => {
      for await (const event of parseSSEStream(response)) {
        if (abortControllerRef.current?.signal.aborted) return;

        switch (event.type) {
          case "thread_id":
            // 스레드 ID 수신 — 필요 시 저장 가능
            break;

          case "message":
            if (
              event.content.type === "custom" &&
              event.content.custom_data?.status
            ) {
              // 진행 상황 업데이트 (ThinkingBar에 표시)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantMsgId
                    ? { ...m, statusText: event.content.custom_data.status }
                    : m,
                ),
              );
            } else if (event.content.type === "ai") {
              // 최종 응답 — token 누적분을 서버 최종 텍스트로 교체 (정합성 보장)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantMsgId
                    ? {
                        ...m,
                        content: event.content.content,
                        statusText: undefined,
                      }
                    : m,
                ),
              );
            }
            break;

          case "token":
            // LLM 토큰 실시간 누적 (사용자에게 보이는 텍스트)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantMsgId
                  ? {
                      ...m,
                      content: m.content + event.content,
                      statusText: undefined,
                    }
                  : m,
              ),
            );
            break;

          case "DONE":
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantMsgId
                  ? { ...m, isStreaming: false, statusText: undefined }
                  : m,
              ),
            );
            break;

          case "error":
            throw new Error(event.content);
        }
      }

      // DONE 이벤트 없이 스트림 종료된 경우 안전하게 처리
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssistantMsgId && m.isStreaming
            ? { ...m, isStreaming: false, statusText: undefined }
            : m,
        ),
      );
    },
    [],
  );

  // ─── 첫 대화 자동 전송 (HomePage에서 진입 시) ───
  const firstMessageSentRef = useRef(false);

  useEffect(() => {
    if (!firstMessageData || firstMessageSentRef.current) return;
    firstMessageSentRef.current = true;

    const attachments: MessageAttachment[] | undefined =
      firstMessageData.attachments.length > 0
        ? firstMessageData.attachments
        : undefined;

    const tempUserMsgId = `temp-first-${Date.now()}`;
    const tempAssistantMsgId = `temp-assistant-${Date.now()}`;

    // 사용자 메시지 + AI 스트리밍 플레이스홀더
    setMessages([
      {
        id: tempUserMsgId,
        role: "user",
        content: firstMessageData.text,
        attachments,
      },
      {
        id: tempAssistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);

    setIsFirstMessageSending(true);
    abortControllerRef.current = new AbortController();

    const sendFirst = async () => {
      try {
        const response = await createConversationApi(
          {
            noteId: Number(noteId),
            text: firstMessageData.text,
            latex: firstMessageData.latex,
            mentionedAssetIds:
              firstMessageData.mentionedAssetIds.length > 0
                ? firstMessageData.mentionedAssetIds
                : undefined,
            chosenFeatures:
              firstMessageData.chosenFeatures.length > 0
                ? firstMessageData.chosenFeatures
                : undefined,
            canvasImageIds:
              firstMessageData.canvasImageIds.length > 0
                ? firstMessageData.canvasImageIds
                : undefined,
          },
          { isStream: true, signal: abortControllerRef.current!.signal },
        );

        await processStream(response, tempAssistantMsgId);

        // 첫 대화 성공 후 노트 상세 refetch → AI가 갱신한 제목 반영
        queryClient.invalidateQueries({
          queryKey: ["notes", "detail", noteId],
        });
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) return;
        console.error("첫 대화 생성 실패:", error);
        firstMessageSentRef.current = false;

        setMessages((prev) => {
          const hasContent = prev.find((m) => m.isStreaming && m.content);
          if (hasContent) {
            return prev.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false } : m,
            );
          }
          return [
            ...prev.filter((m) => !m.isStreaming),
            {
              id: `error-${Date.now()}`,
              role: "assistant" as const,
              content:
                "죄송합니다. 응답을 생성하지 못했습니다. 다시 시도해주세요.",
            },
          ];
        });
      } finally {
        setIsFirstMessageSending(false);
      }
    };

    sendFirst();
  }, [firstMessageData, noteId, processStream, queryClient]);

  // ─── 후속 대화 전송 핸들러 ───
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

      // 3. 첨부 정보
      const messageAttachments: MessageAttachment[] | undefined =
        data.attachments.length > 0
          ? data.attachments.map((a) => ({
              name: a.name,
              mimeType: a.mimeType,
              size: a.size,
              previewUrl: a.previewUrl,
            }))
          : undefined;

      // 4. 낙관적 UI + SSE 스트리밍 API 호출
      const tempUserMsgId = `temp-${Date.now()}`;
      const tempAssistantMsgId = `temp-assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: tempUserMsgId,
          role: "user",
          content: data.message,
          attachments: messageAttachments,
        },
        {
          id: tempAssistantMsgId,
          role: "assistant",
          content: "",
          isStreaming: true,
        },
      ]);

      setIsStreamingResponse(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await createConversationApi(
          {
            noteId: nId,
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
          { isStream: true, signal: abortControllerRef.current.signal },
        );

        await processStream(response, tempAssistantMsgId);

        queryClient.invalidateQueries({
          queryKey: ["notes", "detail", noteId],
        });
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) return;
        console.error("대화 생성 실패:", error);

        setMessages((prev) => {
          const hasContent = prev.find((m) => m.isStreaming && m.content);
          if (hasContent) {
            return prev.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false } : m,
            );
          }
          return [
            ...prev.filter((m) => !m.isStreaming),
            {
              id: `error-${Date.now()}`,
              role: "assistant" as const,
              content:
                "죄송합니다. 응답을 생성하지 못했습니다. 다시 시도해주세요.",
            },
          ];
        });
      } finally {
        setIsStreamingResponse(false);
      }
    },
    [noteId, processStream, queryClient],
  );

  // ─── 파생 데이터 ───
  const noteTitle = noteDetail?.title ?? `노트 ${noteId}`;

  return {
    noteId,
    messages,
    handleSend,
    isSending,
    isFirstMessageSending,
    isNoteLoading: isNoteLoading && !hasFirstMessage,
    noteTitle,
    noteDetail,
    viewerFile,
    hasInitialData: hasFirstMessage,
  };
};
