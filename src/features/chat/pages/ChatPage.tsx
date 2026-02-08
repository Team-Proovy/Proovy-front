/**
 * ChatPage - 대화방
 *
 * URL: /app/chat/:noteId
 * Query Params:
 *   - panel: 'viewer' | 'storage' (기본값: 'viewer')
 *   - file: fileId (특정 파일 열기)
 *
 * 기능:
 * - 왼쪽 패널: Viewer (PDF) / Storage (파일 목록) 탭
 * - 오른쪽 패널: Chat
 * - Divider: 드래그로 패널 크기 조절
 * - 토글 버튼: 왼쪽 패널 열기/닫기
 *
 * 데이터 로드 전략:
 * 1. HomePage에서 노트 생성 직후 진입 → location.state로 첫 대화 데이터 수신 (API 스킵)
 * 2. 사이드바/새로고침/직접 URL 접근 → GET /api/notes/{noteId}로 히스토리 로드
 */

import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LeftPanel,
  RightPanel,
  Divider,
  ChatHeader,
  type PanelTab,
} from "../components";
import { useResizable } from "../hooks/useResizable";
import { useCreateConversation } from "@/features/editor/hooks/useEditorQueries";
import { useNoteDetail } from "@/features/notes/hooks/useNotes";
import { uploadAttachments } from "@/features/assets/utils/upload_attachments";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { CreateNoteResponse } from "@/features/notes/api/notes_types";
import type { ConversationInfo } from "@/features/notes/api/notes_types";
import type { ChatMessage, MessageAttachment } from "../types/chat_types";

// 유효한 PanelTab 값 목록
const VALID_PANEL_TABS: PanelTab[] = ["viewer", "storage"];

const isValidPanelTab = (value: string | null): value is PanelTab => {
  return value !== null && VALID_PANEL_TABS.includes(value as PanelTab);
};

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

export const ChatPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const panelParam = searchParams.get("panel");
  const fileId = searchParams.get("file");

  // 패널 탭 상태 - 유효한 값만 허용, 그 외는 기본값 "viewer"
  const [activeTab, setActiveTab] = useState<PanelTab>(
    isValidPanelTab(panelParam) ? panelParam : "viewer",
  );

  // 뷰어 열림 상태: 파일이 있으면 기본 열림, 없으면 닫힘
  const [isViewerOpen, setIsViewerOpen] = useState(!!fileId);

  // 패널 크기 조절
  const {
    width: leftPanelWidth,
    isDragging,
    handleMouseDown,
  } = useResizable({
    initialWidth: 50,
    leftMinPx: 382,
    rightMinPx: 302,
  });

  // ─── 데이터 로드 전략 ───

  // HomePage에서 노트 생성 후 전달된 첫 대화 데이터
  const createNoteResponse = location.state?.createNoteResponse as
    | CreateNoteResponse
    | undefined;

  // HomePage에서 전달된 첨부파일 정보
  const initialAttachments = useMemo(
    () => (location.state?.attachments ?? []) as MessageAttachment[],
    [location.state?.attachments],
  );

  // HomePage에서 전달된 뷰어 파일 정보
  const viewerFile = location.state?.viewerFile as
    | { name: string; mimeType: string; size: number }
    | undefined;

  // location.state가 있으면 이미 첫 대화 데이터를 갖고 있으므로 API 호출 불필요
  const hasInitialData = !!createNoteResponse?.firstConversation;

  // GET /api/notes/{noteId} — 재진입/새로고침 시 대화 히스토리 로드
  const { data: noteDetail, isLoading: isNoteLoading } = useNoteDetail(
    noteId,
    undefined,
    { enabled: !hasInitialData },
  );

  // ─── 대화 상태 관리 ───

  // 초기 메시지: location.state에서 첫 대화 데이터가 있으면 사용
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

  // API에서 대화 히스토리가 로드되면 messages 갱신
  useEffect(() => {
    if (noteDetail?.conversations && !hasInitialData) {
      // 서버 대화 목록은 최신순 → 오래된 순으로 뒤집기
      const reversed = [...noteDetail.conversations].reverse();
      setMessages(convertConversations(reversed));
    }
  }, [noteDetail, hasInitialData]);

  // 노트 제목 (location.state > API 응답 > 기본값 순)
  const noteTitle =
    createNoteResponse?.title ?? noteDetail?.title ?? `노트 ${noteId}`;

  // 뷰어 자동 열기: API에서 에셋이 로드되었거나 뷰어 파일이 있으면
  useEffect(() => {
    if ((noteDetail?.assets && noteDetail.assets.length > 0) || viewerFile) {
      setIsViewerOpen(true);
    }
  }, [noteDetail?.assets, viewerFile]);

  // React Query 캐시 관리
  const queryClient = useQueryClient();

  // 대화 생성 mutation
  const { mutate: createConversation, isPending: isMutating } =
    useCreateConversation();

  // 첨부 파일 업로드 중 상태
  const [isUploading, setIsUploading] = useState(false);

  // 전송 버튼 비활성화 조건 통합 (업로드 중 || 뮤테이션 중)
  const isSending = isMutating || isUploading;

  // 메시지 전송 핸들러
  const handleSend = useCallback(
    async (data: ChatSendData) => {
      const nId = Number(noteId);
      if (!nId) return;

      // ── 1. 첨부 파일 업로드 (presigned URL → S3 → confirm) ──
      let uploadedFileAssetIds: number[] = [];
      let canvasImageIds: number[] = [];

      if (data.attachments.length > 0) {
        setIsUploading(true);
        try {
          const result = await uploadAttachments(nId, data.attachments);
          uploadedFileAssetIds = result.fileAssetIds;
          canvasImageIds = result.canvasAssetIds;
          // 업로드 완료 → # 멘션 에셋 목록 캐시 갱신
          queryClient.invalidateQueries({
            queryKey: ["noteAssets", nId],
          });
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

      // ── 2. assetId 병합 (멘션 + 업로드된 파일) ──
      const allAssetIds = [...data.mentionedAssetIds, ...uploadedFileAssetIds];

      // ── 3. 낙관적 UI: 사용자 메시지 즉시 추가 ──
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
      const userMsg: ChatMessage = {
        id: tempUserMsgId,
        role: "user",
        content: data.message,
        attachments: messageAttachments,
      };
      setMessages((prev) => [...prev, userMsg]);

      // ── 4. API 호출 ──
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

  // URL 파라미터 동기화
  useEffect(() => {
    if (isViewerOpen) {
      setSearchParams((prev) => {
        prev.set("panel", activeTab);
        return prev;
      });
    }
  }, [activeTab, isViewerOpen, setSearchParams]);

  // 탭 변경 핸들러
  const handleTabChange = (tab: PanelTab) => {
    setActiveTab(tab);
  };

  // 뷰어 토글 핸들러
  const handleToggleViewer = () => {
    setIsViewerOpen((prev) => !prev);
  };

  return (
    <div
      id="chat-container"
      className="flex h-full w-full flex-col"
    >
      {/* 상단 헤더 - 전체 너비 */}
      <ChatHeader
        title={noteTitle}
        isViewerOpen={isViewerOpen}
        onToggleViewer={handleToggleViewer}
      />

      {/* 하단 패널 영역 */}
      <div className="relative flex min-h-0 flex-1">
        {/* Left Panel - Viewer/Storage */}
        {isViewerOpen && (
          <>
            <div
              className="h-full border-r border-[#D1D6DE]"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <LeftPanel
                activeTab={activeTab}
                onTabChange={handleTabChange}
                noteId={noteId || ""}
                selectedFileId={fileId || undefined}
              />
            </div>

            {/* Divider */}
            <Divider
              onMouseDown={handleMouseDown}
              isDragging={isDragging}
            />
          </>
        )}

        {/* Right Panel - Chat */}
        <div
          className="h-full min-w-0 overflow-hidden"
          style={{ width: isViewerOpen ? `${100 - leftPanelWidth}%` : "100%" }}
        >
          <RightPanel
            messages={messages}
            noteId={noteId ? Number(noteId) : null}
            onSend={handleSend}
            isSending={isSending}
            isLoading={isNoteLoading && !hasInitialData}
          />
        </div>
      </div>
    </div>
  );
};
