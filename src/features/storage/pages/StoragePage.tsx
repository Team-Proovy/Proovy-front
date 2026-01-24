/**
 * StoragePage - 전체 저장소 페이지
 *
 * URL: /app/storage
 *
 * 기능:
 * - 모든 노트의 파일을 통합하여 표시
 * - 파일 검색/필터링
 * - 파일 클릭 → 해당 노트의 뷰어로 이동
 */

import { Link } from "react-router-dom";

export const StoragePage = () => {
  // TODO: useAllFiles() 훅으로 전체 파일 fetch
  const mockFiles = [
    {
      id: "f1",
      name: "이산수학_HW2.pdf",
      noteId: "1",
      noteTitle: "이산수학 과제2",
      size: "2.4MB",
    },
    {
      id: "f2",
      name: "강의노트.pdf",
      noteId: "1",
      noteTitle: "이산수학 과제2",
      size: "1.2MB",
    },
    {
      id: "f3",
      name: "선형대수_정리.pdf",
      noteId: "2",
      noteTitle: "선형대수 복습",
      size: "3.1MB",
    },
  ];

  return (
    <div className="h-full overflow-auto p-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          저장소 (임시 디자인)
        </h1>
        <span className="text-sm text-gray-500">전체 용량: 240/500MB</span>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="파일명을 입력해주세요"
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* 파일 그리드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockFiles.map((file) => (
          <Link
            key={file.id}
            to={`/app/note/${file.noteId}?panel=viewer&file=${file.id}`}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-400 hover:shadow-md"
          >
            {/* 파일 아이콘 */}
            <div className="mb-3 flex h-20 items-center justify-center rounded bg-blue-50">
              <span className="text-3xl">📄</span>
            </div>

            {/* 파일명 */}
            <h3 className="truncate text-sm font-medium text-gray-900">
              {file.name}
            </h3>

            {/* 메타 정보 */}
            <div className="mt-1 text-xs text-gray-500">
              <p className="truncate">{file.noteTitle}</p>
              <p>{file.size}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
