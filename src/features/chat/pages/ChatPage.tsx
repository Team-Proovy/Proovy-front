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

import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LeftPanel,
  RightPanel,
  Divider,
  ChatHeader,
  type PanelTab,
} from "../components";
import { useResizable } from "../hooks/useResizable";

export const ChatPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const panelParam = searchParams.get("panel") as PanelTab | null;
  const fileId = searchParams.get("file");

  // 패널 탭 상태
  const [activeTab, setActiveTab] = useState<PanelTab>(panelParam || "viewer");

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

  // TODO: 실제 노트 제목 가져오기
  const noteTitle = "이산수학 과제2 3단원";

  // TODO: 실제 메시지 데이터 가져오기
  const messages = [
    {
      id: "1",
      role: "user" as const,
      content:
        "안녕! 1번 문제를 풀어줘. 풀이과정을 단계별로 자세하게 설명하고 변형 문제를 생성해줘.dddddddddddddddddddddddddddddddddddddddddㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ",
    },
    {
      id: "2",
      role: "assistant" as const,
      content:
        "안녕하세요! 1번 문제에 나오는 개념을 설명하고, 상세하게 풀이를 작성해볼게요! ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ",
    },
    {
      id: "1",
      role: "user" as const,
      content:
        "안녕! 1번 문제를 풀어줘. 풀이과정을 단계별로 자세하게 설명하고 변형 문제를 생성해줘.dddddddddddddddddddddddddddddddddddddddddㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ",
    },
    {
      id: "2",
      role: "assistant" as const,
      content:
        "안녕하세요! 1번 문제에 나오는 개념을 설명하고, 상세하게 풀이를 작성해볼게요! ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ",
    },
    {
      id: "1",
      role: "user" as const,
      content:
        "안녕! 1번 문제를 풀어줘. 풀이과정을 단계별로 자세하게 설명하고 변형 문제를 생성해줘.dddddddddddddddddddddddddddddddddddddddddㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ",
    },
    {
      id: "2",
      role: "assistant" as const,
      content:
        "안녕하세요! 1번 문제에 나오는 개념을 설명하고, 상세하게 풀이를 작성해볼게요! ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ",
    },
  ];

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
          <RightPanel messages={messages} />
        </div>
      </div>
    </div>
  );
};
