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

import { useParams } from "react-router-dom";
import { LeftPanel, RightPanel, Divider, ChatHeader } from "../components";
import { useChatMessages } from "../hooks/useChatMessages";
import { useChatPanel } from "../hooks/useChatPanel";

/**
 * noteId가 변경될 때 전체 컴포넌트 리마운트를 강제하는 래퍼.
 * 같은 라우트 패턴(/app/chat/:noteId)에서 다른 노트로 이동 시
 * React Router가 컴포넌트를 재사용하여 useRef/state가 stale해지는 문제를 방지.
 */
export const ChatPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  return <ChatPageContent key={noteId} />;
};

const ChatPageContent = () => {
  const {
    noteId,
    messages,
    handleSend,
    isSending,
    isNoteLoading,
    noteTitle,
    noteDetail,
    viewerFile,
  } = useChatMessages();

  const {
    activeTab,
    fileId,
    isViewerOpen,
    leftPanelWidth,
    isDragging,
    handleMouseDown,
    handleTabChange,
    handleToggleViewer,
  } = useChatPanel({
    hasViewerFile: !!viewerFile,
    assets: noteDetail?.assets,
  });

  return (
    <div
      id="chat-container"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
    >
      <ChatHeader
        title={noteTitle}
        isViewerOpen={isViewerOpen}
        onToggleViewer={handleToggleViewer}
      />

      <div className="relative flex min-h-0 flex-1">
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
            <Divider
              onMouseDown={handleMouseDown}
              isDragging={isDragging}
            />
          </>
        )}

        <div
          className="h-full min-w-0 overflow-hidden"
          style={{ width: isViewerOpen ? `${100 - leftPanelWidth}%` : "100%" }}
        >
          <RightPanel
            messages={messages}
            noteId={noteId ? Number(noteId) : null}
            onSend={handleSend}
            isSending={isSending}
            isLoading={isNoteLoading}
          />
        </div>
      </div>
    </div>
  );
};
