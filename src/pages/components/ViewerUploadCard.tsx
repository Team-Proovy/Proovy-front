import { X } from "lucide-react";
import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";
import { PdfPreview } from "@/shared/components/pdf-preview/PdfPreview";
import { FILE_ACCEPT } from "@/features/assets/utils/fileValidation";
import { DragDropOverlay } from "@/features/editor/components/input/DragDropOverlay";

interface ViewerUploadCardProps {
  pdfUrl: string | null;
  fileName: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenExplorer: () => void;
  onRemove: (e: React.MouseEvent) => void;
  isDragging: boolean;
  dragProps: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * 뷰어 파일 업로드 카드
 *
 * - 기본 상태: 업로드 버튼
 * - 업로드 완료: PDF/이미지 썸네일 + 파일명 + 닫기 버튼
 */
export const ViewerUploadCard = ({
  pdfUrl,
  fileName,
  fileInputRef,
  onFileChange,
  onOpenExplorer,
  onRemove,
  isDragging,
  dragProps,
}: ViewerUploadCardProps) => (
  <div
    className="relative shrink-0"
    {...dragProps}
  >
    <input
      type="file"
      ref={fileInputRef}
      className="hidden"
      onChange={onFileChange}
      accept={FILE_ACCEPT}
    />

    {/* Drag Overlay */}
    {isDragging && (
      <div className="absolute inset-0 z-50 overflow-hidden rounded-[12px]">
        <DragDropOverlay />
      </div>
    )}

    {pdfUrl ? (
      <div className="group relative flex h-[160px] w-full shrink-0 flex-col items-center overflow-hidden rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-all lg:w-[220px]">
        {/* 닫기 버튼 */}
        <button
          onClick={onRemove}
          className="absolute top-[8px] right-[8px] z-10 flex cursor-pointer items-center justify-center"
        >
          <X
            size={18}
            color="#000000"
          />
        </button>

        {/* PDF/이미지 썸네일 */}
        <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden lg:w-[160px]">
          <div className="flex h-full w-full items-center justify-center">
            {fileName.toLowerCase().endsWith(".pdf") ? (
              <PdfPreview
                key={pdfUrl}
                fileUrl={pdfUrl}
                width={160}
              />
            ) : (
              <img
                src={pdfUrl}
                alt="preview"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        {/* 파일명 */}
        <div className="flex h-[32px] w-full shrink-0 items-center justify-center border-t-[0.5px] border-[#C6C6C6] bg-white px-3">
          <p className="truncate text-[13px] font-medium text-[#333333]">
            {fileName}
          </p>
        </div>

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    ) : (
      <button
        onClick={onOpenExplorer}
        type="button"
        className="group flex h-[160px] w-full shrink-0 cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[24px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33] lg:w-[220px]"
      >
        <div>
          <PdfIcon size={56} />
        </div>
        <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
          뷰어로 파일 업로드
        </p>
      </button>
    )}
  </div>
);
