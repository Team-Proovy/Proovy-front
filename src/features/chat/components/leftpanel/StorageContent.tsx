interface StorageContentProps {
  noteId: string;
}

export const StorageContent = ({ noteId: _noteId }: StorageContentProps) => {
  // TODO: 실제 파일 목록 API 연결 (noteId 사용 예정)
  const mockFiles = [
    { id: "1", name: "discrete_math_HW2.pdf", type: "pdf" },
    { id: "2", name: "[solution] exercise of RREF.pdf", type: "pdf" },
  ];

  const mockThreads = [{ id: "t1", name: "THREAD 1번" }];

  return (
    <div className="flex h-full flex-col">
      {/* 용량 표시 */}
      <div className="flex items-center justify-end gap-2 border-b px-4 py-2">
        <span className="text-sm text-gray-500">노트 용량</span>
        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/2 bg-blue-500" />
        </div>
        <span className="text-sm text-gray-500">240/500MB</span>
      </div>

      {/* BOX 섹션 */}
      <div className="border-b p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-900">BOX</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* 파일 업로드 카드 */}
          <button className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
              />
            </svg>
            <span className="text-xs">파일 업로드하기</span>
          </button>

          {/* 파일 카드들 */}
          {mockFiles.map((file) => (
            <button
              key={file.id}
              className="relative flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-400"
            >
              <span className="absolute top-2 right-2 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
                원본
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-50">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-500"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="line-clamp-2 text-center text-xs text-gray-600">
                {file.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* THREAD 섹션 */}
      <div className="flex-1 p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-900">THREAD</h3>
        <div className="grid grid-cols-2 gap-3">
          {mockThreads.map((thread) => (
            <button
              key={thread.id}
              className="flex h-28 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-blue-400"
            >
              <span className="text-sm text-gray-600">{thread.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-2 border-t p-4">
        <button className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600">
          뷰어에서 열기
        </button>
        <button className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          삭제하기
        </button>
      </div>
    </div>
  );
};
