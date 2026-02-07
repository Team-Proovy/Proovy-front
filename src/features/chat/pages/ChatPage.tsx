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
 * 사용자 흐름:
 * 1. 파일 없이 채팅 시작 → 전체 화면 채팅 (토글로 뷰어 열기 가능)
 * 2. 파일 업로드 후 채팅 시작 → 뷰어 + 채팅 분할 화면
 */

import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LeftPanel,
  RightPanel,
  Divider,
  ChatHeader,
  type PanelTab,
} from "../components";
import { useResizable } from "../hooks/useResizable";
import { useCreateConversation } from "@/features/editor/hooks/useEditorQueries";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import type { CreateNoteResponse } from "@/features/notes/api/notes_types";

// 유효한 PanelTab 값 목록
const VALID_PANEL_TABS: PanelTab[] = ["viewer", "storage"];

const isValidPanelTab = (value: string | null): value is PanelTab => {
  return value !== null && VALID_PANEL_TABS.includes(value as PanelTab);
};

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
    leftMinPx: 382, // 왼쪽 패널: 버튼 350px + 좌우 패딩 16px * 2
    rightMinPx: 302, // 오른쪽 패널: 입력창 270px + 좌우 패딩 16px * 2
  });

  // ─── 대화 상태 관리 ───
  interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
  }

  // HomePage에서 노트 생성 후 전달된 첫 대화 데이터
  const createNoteResponse = location.state?.createNoteResponse as
    | CreateNoteResponse
    | undefined;

  // 초기 메시지: location.state에서 첫 대화 데이터가 있으면 사용
  const buildInitialMessages = (): ChatMessage[] => {
    if (!createNoteResponse?.firstConversation) return [];
    const { userMessage, assistantMessage } =
      createNoteResponse.firstConversation;
    return [
      {
        id: `msg-${userMessage.messageId}`,
        role: "user",
        content: userMessage.content,
      },
      {
        id: `msg-${assistantMessage.messageId}`,
        role: "assistant",
        content: assistantMessage.content,
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(buildInitialMessages);

  // 노트 제목 (location.state에서 가져오거나 기본값)
  const noteTitle = createNoteResponse?.title ?? `노트 ${noteId}`;

  // 대화 생성 mutation
  const { mutate: createConversation, isPending: isSending } =
    useCreateConversation();

  // 메시지 전송 핸들러
  const handleSend = (data: ChatSendData) => {
    // 낙관적 UI: 사용자 메시지 즉시 추가
    const tempUserMsgId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: "user",
      content: data.message,
    };
    setMessages((prev) => [...prev, userMsg]);

    // API 호출
    createConversation(
      {
        text: data.message,
        mentionedAssetIds:
          data.mentionedAssetIds.length > 0
            ? data.mentionedAssetIds
            : undefined,
        chosenFeatures:
          data.mentionedToolCodes.length > 0
            ? data.mentionedToolCodes
            : undefined,
      },
      {
        onSuccess: (response) => {
          const { assistantMessage } = response.result;
          // AI 응답 메시지 추가
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${assistantMessage.messageId}`,
              role: "assistant",
              content: assistantMessage.content,
            },
          ]);
        },
        onError: (error) => {
          console.error("대화 생성 실패:", error);
          // 에러 시 에러 메시지 표시
          setMessages((prev) => [
            ...prev,
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
  };

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
          />
        </div>
      </div>
    </div>
  );
};
