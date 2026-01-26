/**
 * NotesPage - 노트 목록 페이지
 *
 * URL: /app/notes
 *
 * 기능:
 * - 전체 노트 목록 표시
 * - 노트 카드 클릭 → /app/chat/:chatId 로 이동
 * - "노트 추가하기" 클릭 → /app/home 으로 이동
 */

import { Link } from "react-router-dom";

export const NotesPage = () => {
  // TODO: useNotes() 훅으로 노트 목록 fetch
  const mockNotes = [
    { id: "1", title: "이산수학 과제2 3단원", messageCount: 12, fileCount: 3 },
    { id: "2", title: "선형대수 복습", messageCount: 5, fileCount: 1 },
    { id: "3", title: "알고리즘 스터디", messageCount: 8, fileCount: 0 },
  ];

  return (
    <div className="h-full overflow-auto p-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          노트 목록 (임시 디자인)
        </h1>
        <span className="text-sm text-gray-500">노트 개수: 3/5</span>
      </div>

      {/* 노트 그리드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* 노트 추가하기 카드 */}
        <Link
          to="/app/home"
          className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
        >
          <span className="text-3xl text-gray-400">+</span>
          <span className="mt-2 text-sm text-gray-500">노트 추가하기</span>
        </Link>

        {/* 노트 카드 목록 */}
        {mockNotes.map((note) => (
          <Link
            key={note.id}
            to={`/app/chat/${note.id}`}
            className="flex h-40 flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-400 hover:shadow-md"
          >
            <h3 className="font-medium text-gray-900">{note.title}</h3>
            <div className="text-xs text-gray-500">
              <span>{note.messageCount}개 대화</span>
              <span className="mx-2">•</span>
              <span>{note.fileCount}개 파일</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
