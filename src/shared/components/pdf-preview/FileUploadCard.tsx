import { X } from "lucide-react";
import { PdfPreview } from "./PdfPreview";
import { PdfIcon } from "../icons/HomepageInputIcons";

interface FileUploadCardProps {
  fileUrl: string | null;
  fileName: string;
  onRemove: (e: React.MouseEvent) => void;
  onUploadClick: () => void;
}

export const FileUploadCard = ({
  fileUrl,
  fileName,
  onRemove,
  onUploadClick,
}: FileUploadCardProps) => {
  if (fileUrl) {
    return (
      <div className="group relative flex h-[160px] w-[220px] shrink-0 flex-col items-center overflow-hidden rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-all">
        {/* 닫기 버튼: 우상단 고정 */}
        <button
          onClick={onRemove}
          className="absolute top-[8px] right-[8px] z-10 flex cursor-pointer items-center justify-center"
        >
          <X
            size={24}
            color="#000000"
            className="transition-colors duration-300 hover:stroke-[#2A6AFF]"
          />
        </button>

        {/* 상단: PDF 썸네일 영역 (세로 고정, 위아래 잘림 처리) */}
        <div className="relative flex h-[140px] w-[160px] items-start justify-center overflow-hidden">
          <div className="flex h-full w-full items-center justify-center">
            {/* 이미지 파일이면 img 태그, PDF면 PdfPreview */}
            {fileName.toLowerCase().endsWith(".pdf") ? (
              <PdfPreview
                key={fileUrl}
                fileUrl={fileUrl}
                width={160}
              />
            ) : (
              <img
                src={fileUrl}
                alt="preview"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        {/* 하단: 파일명 영역 */}
        <div className="flex h-[50px] w-full items-center justify-center border-t-[0.5px] border-[#C6C6C6] bg-white px-3">
          <p className="truncate text-[13px] font-medium text-[#333333]">
            {fileName}
          </p>
        </div>

        {/* Hover Overlay: 전체 영역 어둡게 처리 */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <button
      onClick={onUploadClick}
      className="group flex h-[160px] w-[220px] shrink-0 cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
    >
      <div>
        <PdfIcon size={56} />
      </div>
      <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
        뷰어로 파일 업로드
      </p>
    </button>
  );
};
