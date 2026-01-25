/**
 * ChatPage - 대화방
 *
 * URL: /app/chat/:chatId
 * Query Params:
 *   - panel: 'viewer' | 'storage' (기본값: 'viewer')
 *   - file: fileId (특정 파일 열기)
 *
 * 기능:
 * - 왼쪽 패널: Viewer (PDF) / Storage (파일 목록) 탭
 * - 오른쪽 패널: Chat / Chat History 탭
 * - 뷰어 토글 (열기/닫기)
 */

import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";

export const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [searchParams] = useSearchParams();

  const panel = searchParams.get("panel") || "viewer";
  const fileId = searchParams.get("file");

  // TODO: 파일 있으면 기본 열림, 없으면 닫힘
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  return (
    <div className="relative flex h-full w-full">
      {/* 뷰어 토글 버튼 (닫혀있을 때만 표시) */}
      {!isViewerOpen && (
        <button
          onClick={() => setIsViewerOpen(true)}
          className="absolute top-0 left-0 z-10 flex h-10 w-full items-center justify-center border-b bg-gray-50 text-sm text-gray-500 hover:bg-gray-100"
        >
          ═══ 뷰어 열기 ═══
        </button>
      )}

      {/* Left Panel - Viewer/Storage */}
      {isViewerOpen && (
        <div className="flex h-full w-1/2 flex-col border-r border-gray-200 bg-white">
          {/* 탭 헤더 */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex gap-6">
              <button
                className={`text-sm font-medium ${
                  panel === "viewer" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Viewer
              </button>
              <button
                className={`text-sm font-medium ${
                  panel === "storage" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                Storage
              </button>
            </div>
            <button
              onClick={() => setIsViewerOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 패널 내용 */}
          <div className="flex flex-1 items-center justify-center text-gray-400">
            {panel === "viewer" && (
              <span>
                {fileId ? `PDF 뷰어: ${fileId}` : "파일을 선택하세요"}
              </span>
            )}
            {panel === "storage" && <span>파일 목록</span>}
          </div>
        </div>
      )}

      {/* Right Panel - Chat */}
      <div
        className={`flex h-full flex-col bg-white ${isViewerOpen ? "w-1/2" : "w-full"}`}
      >
        {/* 탭 헤더 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex gap-6">
            <button className="text-sm font-medium text-blue-600">Chat</button>
            <button className="text-sm font-medium text-gray-500">
              Chat History
            </button>
          </div>
          <span className="text-sm text-gray-600">채팅 ID: {chatId}</span>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-gray-400">메시지가 표시될 영역</div>
        </div>

        {/* 입력창 */}
        <div className="border-t p-4">
          <div className="rounded-lg border border-gray-300 p-3 text-gray-400">
            입력창 (ChatInput 컴포넌트 연결 예정)
          </div>
        </div>
      </div>
    </div>
  );
};
