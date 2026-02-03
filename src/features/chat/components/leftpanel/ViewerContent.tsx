interface ViewerContentProps {
  noteId: string;
  fileId?: string;
}

export const ViewerContent = ({ noteId, fileId }: ViewerContentProps) => {
  if (!fileId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
        <span>파일을 선택하세요</span>
        <span className="text-sm">Storage 탭에서 파일을 선택해주세요</span>
      </div>
    );
  }

  // TODO: 실제 PDF 뷰어 컴포넌트 연결
  return (
    <div className="flex h-full flex-col">
      {/* 파일 정보 바 */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
        <span className="text-sm font-medium text-gray-700">
          {fileId}.pdf {/* TODO: 실제 파일명 표시 */}
        </span>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button className="hover:text-gray-700">{"<"}</button>
          <span>1 / 12</span>
          <button className="hover:text-gray-700">{">"}</button>
        </div>
      </div>

      {/* PDF 뷰어 영역 */}
      <div className="flex flex-1 items-center justify-center bg-gray-100">
        <div className="text-gray-400">
          PDF 뷰어 (noteId: {noteId}, fileId: {fileId})
        </div>
      </div>
    </div>
  );
};
