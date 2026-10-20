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
 * - 오른쪽 패널: 대화 (browser-run-v1 run 세션, S08)
 * - Divider: 드래그로 패널 크기 조절
 * - 토글 버튼: 왼쪽 패널 열기/닫기
 *
 * 대화 데이터:
 * - 진입·새로고침: 대화 조회(`GET /api/conversations/{noteId}/messages`)로 이력을 그리고 진행 중 run을 이어 받는다.
 * - 홈 첫 질문: 홈이 맡긴 run 세션을 이어 받아 같은 stream을 계속 본다.
 * - 제목·자산 목록은 노트 상세(`GET /api/notes/{noteId}`)에서 읽는다.
 */

import { useParams } from "react-router-dom";
import { LeftPanel, Divider, ChatHeader } from "@/features/chat/components";
import { ConversationPanel } from "@/features/chat/components/rightpanel/ConversationPanel";
import { useChatPanel } from "@/features/chat/hooks/useChatPanel";
import { useNoteConversation } from "@/features/chat/run/useNoteConversation";
import { useNoteDetail } from "@/features/notes/hooks/useNotes";

/**
 * noteId가 변경될 때 전체 컴포넌트 리마운트를 강제하는 래퍼.
 * 같은 라우트 패턴(/app/chat/:noteId)에서 다른 노트로 이동 시
 * React Router가 컴포넌트를 재사용하여 useRef/state가 stale해지는 문제를 방지.
 */
export const ChatPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  if (!noteId) return null;
  return (
    <ChatPageContent
      key={noteId}
      noteId={noteId}
    />
  );
};

/** 노트 상세는 제목·자산만 쓴다(대화는 대화 조회 API). */
const NOTE_DETAIL_PARAMS = { conversationPage: 0, conversationSize: 1 };

const ChatPageContent = ({ noteId }: { noteId: string }) => {
  const conversation = useNoteConversation(noteId);
  const { data: noteDetail } = useNoteDetail(noteId, NOTE_DETAIL_PARAMS);
  const noteTitle = noteDetail?.title ?? `노트 ${noteId}`;

  const {
    activeTab,
    fileId,
    isViewerOpen,
    leftPanelWidth,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    handleTabChange,
    handleToggleViewer,
  } = useChatPanel({
    hasViewerFile: false,
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
                noteId={noteId}
                selectedFileId={fileId || undefined}
              />
            </div>
            <Divider
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              isDragging={isDragging}
            />
          </>
        )}

        <div
          className="h-full min-w-0 overflow-hidden"
          style={{ width: isViewerOpen ? `${100 - leftPanelWidth}%` : "100%" }}
        >
          <ConversationPanel
            conversation={conversation}
            noteNumber={Number(noteId)}
          />
        </div>
      </div>
    </div>
  );
};
