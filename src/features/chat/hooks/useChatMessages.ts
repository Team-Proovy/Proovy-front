import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  createConversation as createConversationApi,
  parseSSEStream,
} from "@/features/editor/api/editor_api";
import { useNoteDetail, noteKeys } from "@/features/notes/hooks/useNotes";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import {
  getUploadUrl,
  uploadToS3,
  confirmUpload,
} from "@/features/assets/api/assetApi";
import { resolveUploadMimeType } from "@/features/assets/utils/fileValidation";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { ConversationInfo } from "@/features/notes/api/notes_types";
import type { FirstMessageState } from "@/pages/hooks/useHomeSend";
import type { ChatMessage, MessageAttachment } from "../types/chat_types";
import { creditKeys } from "@/features/settings/hooks/useCredit";
import { userKeys } from "@/features/settings/hooks/useUser";
import { assetKeys } from "@/features/storage/hooks/useAssets";

type PendingAttachment = ChatSendData["attachments"][number];

/** 서버 ConversationInfo[] → ChatMessage[] 변환 */
const convertConversations = (
  conversations: ConversationInfo[],
): ChatMessage[] =>
  conversations.flatMap((conv) => {
    const messages: ChatMessage[] = [];

    // 사용자 메시지
    messages.push({
      id: `msg-${conv.userMessage.messageId}`,
      role: "user" as const,
      content: conv.userMessage.content,
    });

    // AI 메시지 (빈 내용이면 건너뛰기)
    const assistantContent = conv.assistantMessage.content || "";
    if (assistantContent.trim()) {
      messages.push({
        id: `msg-${conv.assistantMessage.messageId}`,
        role: "assistant" as const,
        content: assistantContent,
      });
    } else {
      // 빈 응답인 경우 에러 메시지 표시
      console.warn(
        `[ChatHistory] Assistant 메시지가 비어있음 - messageId: ${conv.assistantMessage.messageId}`,
      );
      messages.push({
        id: `msg-${conv.assistantMessage.messageId}`,
        role: "assistant" as const,
        content: "응답을 불러올 수 없습니다. 새로고침 후 다시 시도해주세요.",
      });
    }

    return messages;
  });

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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // ─── location.state에서 초기 데이터 추출 (ref로 보존) ───
  // setSearchParams 호출 시 location.state가 null로 초기화되므로
  // 최초 진입 시 ref에 저장하여 패널 토글 등에서도 데이터 유지
  const initialStateRef = useRef(location.state);

  const firstMessageData = initialStateRef.current?.firstMessage as
    | FirstMessageState
    | undefined;
  const chatEntrySource =
    (initialStateRef.current as { chatEntrySource?: string } | null)
      ?.chatEntrySource ?? "unknown";

  const viewerFile = firstMessageData?.viewerFile;

  const hasFirstMessage = !!firstMessageData;

  // ─── 노트 상세 로드 (제목·메타데이터 + 재진입 시 히스토리) ───
  const {
    data: noteDetail,
    isLoading: isNoteLoading,
    isError: isNoteDetailError,
    error: noteDetailError,
  } = useNoteDetail(
    noteId,
    {
      conversationPage: 0,
      conversationSize: 50,
    },
    {
      fetchAllConversations: true,
      refetchOnMount: "always",
    },
  );

  useEffect(() => {
    if (!noteId) return;
    console.info("[ChatHistory] 채팅방 진입", {
      noteId,
      source: chatEntrySource,
      hasFirstMessage,
    });
  }, [noteId, chatEntrySource, hasFirstMessage]);

  useEffect(() => {
    if (!noteId || hasFirstMessage || isNoteLoading) return;

    if (isNoteDetailError) {
      console.error("[ChatHistory] 노트 상세 조회 실패", {
        noteId,
        source: chatEntrySource,
        error: noteDetailError,
      });
      return;
    }

    if (!noteDetail) return;

    const conversationCount = noteDetail.conversations?.length ?? 0;
    const pageInfo = noteDetail.conversationPageInfo;

    if (conversationCount === 0) {
      console.error("[ChatHistory] 노트 상세 조회 성공했지만 대화가 비어있음", {
        noteId,
        source: chatEntrySource,
        conversationCount,
        pageInfo,
      });
      return;
    }

    console.info("[ChatHistory] 대화 히스토리 로드 성공", {
      noteId,
      source: chatEntrySource,
      conversationCount,
      pageInfo,
    });
  }, [
    noteId,
    hasFirstMessage,
    isNoteLoading,
    isNoteDetailError,
    noteDetailError,
    noteDetail,
    chatEntrySource,
  ]);

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
  const managedPreviewUrlsRef = useRef<Set<string>>(new Set());
  const isSending = isStreamingResponse || isUploading || isFirstMessageSending;

  const registerPreviewUrl = useCallback((url?: string) => {
    if (url?.startsWith("blob:")) {
      managedPreviewUrlsRef.current.add(url);
    }
  }, []);

  const toMessageAttachment = useCallback(
    (attachment: PendingAttachment): MessageAttachment => {
      let previewUrl = attachment.previewUrl;

      if (attachment.type === "canvas" && attachment.blob) {
        previewUrl = URL.createObjectURL(attachment.blob);
      } else if (attachment.mimeType.startsWith("image/") && attachment.file) {
        previewUrl = URL.createObjectURL(attachment.file);
      }

      registerPreviewUrl(previewUrl);

      return {
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        previewUrl,
      };
    },
    [registerPreviewUrl],
  );

  // 컴포넌트 언마운트 시 진행 중인 스트리밍 + 미리보기 URL 정리
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      managedPreviewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      managedPreviewUrlsRef.current.clear();
    };
  }, []);

  /** SSE 스트림을 파싱하여 메시지 상태를 실시간 업데이트 */
  const processStream = useCallback(
    async (
      response: Response,
      tempAssistantMsgId: string,
      signal: AbortSignal,
    ) => {
      for await (const event of parseSSEStream(response)) {
        if (signal.aborted) return;

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
              // 최종 응답 — 기존 내용 밑에 추가 (교체 X)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantMsgId
                    ? {
                        ...m,
                        content: m.content + (m.content ? "\n\n" : "") + event.content.content,
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
            console.error("[SSE] 서버 에러:", event.content);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      statusText: undefined,
                      content:
                        typeof event.content === "string"
                          ? event.content
                          : "응답 중 오류가 발생했어요.",
                    }
                  : m,
              ),
            );
            return;
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
        ? firstMessageData.attachments.map((attachment) => {
            registerPreviewUrl(attachment.previewUrl);
            return attachment;
          })
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
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const sendFirst = async () => {
      const signal = abortControllerRef.current!.signal;

      try {
        let uploadedViewerAssetId: number | undefined;
        let uploadedFileAssetIds: number[] = [];
        let uploadedCanvasImageIds: number[] = [];

        if (firstMessageData.pendingViewerFile) {
          const file = firstMessageData.pendingViewerFile;
          const mimeType = resolveUploadMimeType(file);
          if (!mimeType) {
            throw new Error("지원하지 않는 뷰어 파일 형식입니다.");
          }

          const { result } = await getUploadUrl({
            noteId: Number(noteId),
            fileName: file.name,
            mimeType,
            fileSize: file.size,
          });

          await uploadToS3(result.uploadUrl, file, mimeType);
          await confirmUpload(result.assetId);
          uploadedViewerAssetId = result.assetId;
        }

        if (firstMessageData.pendingAttachments?.length) {
          setIsUploading(true);
          const uploadResult = await uploadAttachments(
            Number(noteId),
            firstMessageData.pendingAttachments,
          );
          uploadedFileAssetIds = uploadResult.fileAssetIds;
          uploadedCanvasImageIds = uploadResult.canvasAssetIds;
          setIsUploading(false);
        }

        const response = await createConversationApi(
          {
            noteId: Number(noteId),
            text: firstMessageData.text,
            latex: firstMessageData.latex,
            mentionedAssetIds:
              [...firstMessageData.mentionedAssetIds, ...uploadedFileAssetIds]
                .length > 0
                ? [
                    ...firstMessageData.mentionedAssetIds,
                    ...uploadedFileAssetIds,
                  ]
                : undefined,
            chosenFeatures:
              firstMessageData.chosenFeatures.length > 0
                ? firstMessageData.chosenFeatures
                : undefined,
            canvasImageIds:
              [...firstMessageData.canvasImageIds, ...uploadedCanvasImageIds]
                .length > 0
                ? [
                    ...firstMessageData.canvasImageIds,
                    ...uploadedCanvasImageIds,
                  ]
                : undefined,
          },
          { isStream: true, signal },
        );

        await processStream(response, tempAssistantMsgId, signal);

        if (uploadedViewerAssetId) {
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.set("panel", "viewer");
          nextSearchParams.set("file", String(uploadedViewerAssetId));
          setSearchParams(nextSearchParams, { replace: true });
        }

        // 첫 대화 성공 후 노트 상세 refetch → AI가 갱신한 제목 반영
        queryClient.invalidateQueries({
          queryKey: ["notes", "detail", noteId],
        });
        // 크레딧 잔액 최신화 (대화 생성 시 서버에서 자동 차감)
        queryClient.invalidateQueries({ queryKey: creditKeys.all });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
        queryClient.invalidateQueries({
          queryKey: noteKeys.detail(String(noteId)),
        });
        queryClient.invalidateQueries({ queryKey: assetKeys.storage });
      } catch (error) {
        if (signal.aborted) return;
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
        setIsUploading(false);
        setIsFirstMessageSending(false);
      }
    };

    sendFirst();
  }, [
    firstMessageData,
    noteId,
    processStream,
    queryClient,
    registerPreviewUrl,
    searchParams,
    setSearchParams,
  ]);

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

          // 쿼리 즉시 갱신
          await Promise.all([
            queryClient.refetchQueries({
              queryKey: noteKeys.detail(String(nId)),
            }),
            queryClient.refetchQueries({ queryKey: assetKeys.storage }),
          ]);
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
          ? data.attachments.map(toMessageAttachment)
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
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

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
          { isStream: true, signal },
        );

        await processStream(response, tempAssistantMsgId, signal);

        queryClient.invalidateQueries({
          queryKey: ["notes", "detail", noteId],
        });
        // 크레딧 잔액 최신화 (대화 생성 시 서버에서 자동 차감)
        queryClient.invalidateQueries({ queryKey: creditKeys.all });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      } catch (error) {
        if (signal.aborted) return;
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
    [noteId, processStream, queryClient, toMessageAttachment],
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
