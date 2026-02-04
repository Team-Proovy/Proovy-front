import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";

interface ViewerContentProps {
  noteId: string;
  fileId?: string;
}

export const ViewerContent = ({ noteId, fileId }: ViewerContentProps) => {
  // 파일 업로드 훅 사용
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    (file) => {
      // TODO: 파일 업로드 후 처리 로직
      console.log("ViewerContent에서 파일 선택됨:", file);
    },
  );

  if (!fileId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        {/* hidden input for file upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf"
        />

        {/* 파일 업로드 버튼 - HomePage와 동일 */}
        <button
          onClick={openFileExplorer}
          className="group flex h-[160px] w-[220px] cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
        >
          <div>
            <PdfIcon size={56} />
          </div>
          <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
            뷰어로 파일 업로드
          </p>
        </button>
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
