import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  createConversation as createConversationApi,
  parseSSEStream,
} from "@/features/editor/api/editor_api";
import { useNoteDetail, noteKeys } from "@/features/notes/hooks/useNotes";
import { generateNoteTitle } from "@/features/notes/api/notes_api";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import {
  getUploadUrl,
  uploadToS3,
  confirmUpload,
} from "@/features/assets/api/assetApi";
import { resolveUploadMimeType } from "@/features/assets/utils/fileValidation";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type {
  ConversationInfo,
  AssetInfo,
} from "@/features/notes/api/notes_types";
import type { FirstMessageState } from "@/pages/hooks/useHomeSend";
import type { ChatMessage, MessageAttachment } from "../types/chat_types";
import { creditKeys } from "@/features/settings/hooks/useCredit";
import { userKeys } from "@/features/settings/hooks/useUser";
import { assetKeys } from "@/features/storage/hooks/useAssets";
import { showErrorToast } from "@/shared/lib/toast";

type PendingAttachment = ChatSendData["attachments"][number];

const MOCK_TOOL_STATUSES: NonNullable<ChatMessage["toolStatuses"]> = [
  {
    id: "mock-python-create",
    icon: "python",
    label: "파이썬 코드 생성 중...",
  },
  {
    id: "mock-python-calculate",
    icon: "python",
    label: "파이썬 코드로 문제의 정답 계산 중...",
  },
  {
    id: "mock-transform-create",
    icon: "transform",
    label: "변형 문제가 생성되는 중...",
  },
];

const withMockToolStatuses = (messages: ChatMessage[]) => {
  const firstAssistantIndex = messages.findIndex(
    (message) => message.role === "assistant",
  );

  if (firstAssistantIndex === -1) return messages;

  return messages.map((message, index) =>
    index === firstAssistantIndex
      ? { ...message, toolStatuses: MOCK_TOOL_STATUSES }
      : message,
  );
};

/** 서버 ConversationInfo[] → ChatMessage[] 변환 */
const convertConversations = (
  conversations: ConversationInfo[],
  assets: AssetInfo[],
): ChatMessage[] => {
  const assetMap = new Map(assets.map((a) => [a.assetId, a]));

  return conversations.flatMap((conv) => {
    const messages: ChatMessage[] = [];

    // mentionedAssets → MessageAttachment[] 복원
    const mentioned = conv.userMessage.mentionedAssets ?? [];
    const attachments: MessageAttachment[] | undefined =
      mentioned.length > 0
        ? mentioned.map((ma) => {
            const asset = assetMap.get(ma.assetId);
            const isImage = asset?.fileType?.toUpperCase() === "IMAGE";
            const mimeType = isImage
              ? "image/png"
              : (asset?.fileType ?? "application/octet-stream");
            return {
              name: ma.fileName,
              mimeType,
              size: asset?.fileSize ?? 0,
              previewUrl: isImage
                ? (asset?.thumbnailUrl ?? undefined)
                : undefined,
            };
          })
        : undefined;

    // 사용자 메시지
    messages.push({
      id: `msg-${conv.userMessage.messageId}`,
      role: "user" as const,
      content: conv.userMessage.content,
      attachments,
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
};

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
  const shouldUseToolStatusMock =
    import.meta.env.DEV && searchParams.get("toolStatusMock") === "true";

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
      const serverMessages = convertConversations(
        reversed,
        noteDetail.assets ?? [],
      );

      setMessages((prev) => {
        const serverIds = new Set(serverMessages.map((m) => m.id));
        const localOnly = prev.filter((m) => !serverIds.has(m.id));
        const mergedMessages = [...serverMessages, ...localOnly];
        return shouldUseToolStatusMock
          ? withMockToolStatuses(mergedMessages)
          : mergedMessages;
      });
    }
  }, [noteDetail, hasFirstMessage, shouldUseToolStatusMock]);

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
    const managedPreviewUrls = managedPreviewUrlsRef.current;

    return () => {
      abortControllerRef.current?.abort();
      managedPreviewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      managedPreviewUrls.clear();
    };
  }, []);

  /** SSE v2 스트림을 파싱하여 메시지 상태를 실시간 업데이트 */
  const processStream = useCallback(
    async (
      response: Response,
      tempAssistantMsgId: string,
      signal: AbortSignal,
    ) => {
      // 현재 활성 LLM message_id (중간 노드) → tempAssistantMsgId에 토큰 스트리밍
      let activeLLMMsgId: string | null = null;
      // FinalResponse LLM의 message_id
      let finalLLMMsgId: string | null = null;
      // FinalResponse 전용 말풍선 ID
      let finalRespMsgId: string | null = null;

      // FinalResponse 또는 단순 응답 노드
      const FINAL_NODES = new Set([
        "FinalResponse",
        "Simple_response",
        "Fallback",
      ]);

      for await (const event of parseSSEStream(response)) {
        if (signal.aborted) return;

        switch (event.event) {
          // ── 진행 상황 → ThinkingBar ──────────────────────────────
          case "node.progress": {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantMsgId && m.isStreaming
                  ? { ...m, statusText: event.message }
                  : m,
              ),
            );
            break;
          }

          // ── LLM 시작 ────────────────────────────────────────────
          case "llm.message.started": {
            if (FINAL_NODES.has(event.node) && !finalLLMMsgId) {
              // ── FinalResponse 시작 → 새 말풍선 생성 ──────────────
              finalLLMMsgId = event.message_id;
              activeLLMMsgId = null;
              const newId = `final-${Date.now()}`;
              finalRespMsgId = newId;

              setMessages((prev) => {
                // 기존 생각 말풍선: content 있으면 freeze, 없으면 제거
                const thinkingMsg = prev.find(
                  (m) => m.id === tempAssistantMsgId,
                );
                const hasThinkingContent = !!thinkingMsg?.content?.trim();

                const base = hasThinkingContent
                  ? prev.map((m) =>
                      m.id === tempAssistantMsgId
                        ? { ...m, isStreaming: false, statusText: undefined }
                        : m,
                    )
                  : prev.filter((m) => m.id !== tempAssistantMsgId);

                return [
                  ...base,
                  {
                    id: newId,
                    role: "assistant" as const,
                    content: "",
                    isStreaming: true,
                  },
                ];
              });
            } else if (!FINAL_NODES.has(event.node) && !finalLLMMsgId) {
              // ── 중간 노드 LLM 시작 → tempAssistantMsgId에 스트리밍 ──
              activeLLMMsgId = event.message_id;
            }
            break;
          }

          // ── 실시간 토큰 ──────────────────────────────────────────
          case "llm.token.delta": {
            if (
              finalLLMMsgId &&
              event.message_id === finalLLMMsgId &&
              finalRespMsgId
            ) {
              // FinalResponse 토큰 → FinalResponse 말풍선에 누적
              const targetId = finalRespMsgId;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === targetId
                    ? { ...m, content: m.content + event.delta }
                    : m,
                ),
              );
            } else if (
              !finalLLMMsgId &&
              activeLLMMsgId &&
              event.message_id === activeLLMMsgId
            ) {
              // 중간 노드 토큰 → ThinkingBar 말풍선에 누적 (statusText 제거로 content 전환)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantMsgId
                    ? {
                        ...m,
                        content: m.content + event.delta,
                        statusText: undefined,
                      }
                    : m,
                ),
              );
            }
            break;
          }

          // ── 완성된 메시지 확정 ───────────────────────────────────
          case "chat.message": {
            if (
              event.kind === "assistant_final" ||
              event.kind === "assistant_partial"
            ) {
              const content =
                typeof event.content === "string"
                  ? event.content
                  : String(event.content ?? "");

              // 토큰 스트리밍이 있었으면 finalRespMsgId, 없었으면 tempAssistantMsgId에 확정
              const targetId = finalRespMsgId ?? tempAssistantMsgId;
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== targetId) return m;
                  // 빈 content로 이미 스트리밍된 토큰을 덮어쓰지 않도록 방지
                  if (content && m.content !== content) {
                    return { ...m, content, statusText: undefined };
                  }
                  return { ...m, statusText: undefined };
                }),
              );

              if (!finalRespMsgId) {
                finalRespMsgId = tempAssistantMsgId;
              }
            } else if (event.kind === "system_notice") {
              // 크레딧 부족 등 시스템 알림 → 별도 말풍선
              const content =
                typeof event.content === "string"
                  ? event.content
                  : "시스템 알림";
              const noticeId = `notice-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: noticeId,
                  role: "assistant" as const,
                  content,
                  isStreaming: false,
                },
              ]);
            }
            break;
          }

          // ── 스트리밍 완료 ────────────────────────────────────────
          case "run.completed": {
            setMessages((prev) =>
              prev.map((m) =>
                m.isStreaming
                  ? { ...m, isStreaming: false, statusText: undefined }
                  : m,
              ),
            );
            break;
          }

          // ── 스트리밍 실패 ────────────────────────────────────────
          case "run.failed": {
            console.error("[SSE v2] run.failed:", event.message);
            setMessages((prev) =>
              prev.map((m) =>
                m.isStreaming
                  ? {
                      ...m,
                      isStreaming: false,
                      statusText: undefined,
                      content:
                        m.content ||
                        event.message ||
                        "응답 중 오류가 발생했어요.",
                    }
                  : m,
              ),
            );
            return;
          }

          default:
            break;
        }
      }

      // 스트림이 run.completed 없이 종료된 경우 안전하게 처리
      setMessages((prev) =>
        prev.map((m) =>
          m.isStreaming
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
        toolStatuses: shouldUseToolStatusMock ? MOCK_TOOL_STATUSES : undefined,
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

        // 제목 생성을 스트리밍과 병렬로 백그라운드 실행 (실패해도 기존 제목 유지)
        void generateNoteTitle(Number(noteId), { text: firstMessageData.text })
          .then((response) => {
            if (!response.isSuccess) return;
            void queryClient.invalidateQueries({
              queryKey: noteKeys.detail(String(noteId)),
            });
            void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
          })
          .catch(() => {
            // 실패 시 날짜/시간 제목 유지, 에러 표시 안함
          });

        await processStream(response, tempAssistantMsgId, signal);

        // 성공 후 navigation state의 firstMessage를 제거해 새로고침 시 재전송 방지
        // React Router v6은 history.state.usr에 state를 저장함
        try {
          const hs = window.history.state as Record<string, unknown> | null;
          if (hs?.usr !== undefined) {
            const usr = hs.usr as Record<string, unknown>;
            window.history.replaceState(
              { ...hs, usr: { ...usr, firstMessage: undefined } },
              "",
            );
          }
        } catch {
          // history 조작 실패는 무시
        }

        if (uploadedViewerAssetId) {
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.set("panel", "viewer");
          nextSearchParams.set("file", String(uploadedViewerAssetId));
          setSearchParams(nextSearchParams, { replace: true });
        }

        // 첫 대화 성공 후 노트 상세 refetch → AI가 갱신한 제목 반영
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
        showErrorToast(
          "첫 대화 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
        );

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
    shouldUseToolStatusMock,
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
          toolStatuses: shouldUseToolStatusMock
            ? MOCK_TOOL_STATUSES
            : undefined,
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
          queryKey: noteKeys.detail(String(nId)),
        });
        // 크레딧 잔액 최신화 (대화 생성 시 서버에서 자동 차감)
        queryClient.invalidateQueries({ queryKey: creditKeys.all });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      } catch (error) {
        if (signal.aborted) return;
        console.error("대화 생성 실패:", error);
        showErrorToast("대화 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");

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
    [
      noteId,
      processStream,
      queryClient,
      shouldUseToolStatusMock,
      toMessageAttachment,
    ],
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
