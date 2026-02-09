import { LoadingSpinner } from "@/shared/components/loading-spinner";
import {
  StorageCheckboxUncheckedIcon,
  StorageCheckboxCheckedIcon,
} from "../../../shared/components/icons/StorageIcons";
import { PdfPreview } from "../../../shared/components/pdf-preview/PdfPreview";

// API 명세서의 ocrStatus 타입을 반영
type OcrStatus = "pending" | "processing" | "completed" | "failed";

interface NoteCardProps {
  label: string; // fileName
  type: "upload" | "ai"; // source 필드 기반
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: () => void;
  fileUrl?: string;
  mimeType?: string;
  ocrStatus?: OcrStatus;
  onClick?: () => void;
}

export const NoteCard = ({
  label,
  type,
  isSelected,
  isSelectMode,
  onSelect,
  fileUrl,
  mimeType,
  ocrStatus = "completed",
  onClick,
}: NoteCardProps) => {
  // 소스에 따른 배지 텍스트 결정
  const badgeText = type === "upload" ? "업로드" : "AI 생성";

  return (
    <div
      onClick={() => (isSelectMode ? onSelect() : onClick?.())}
      className="group relative flex cursor-pointer flex-col transition-transform hover:scale-[1.02]"
      style={{
        width: "240px",
        height: "180px",
        borderRadius: "12px",
        border: isSelected ? "1.5px solid #2A6AFF" : "0.5px solid #D1D6DE",
        background: isSelected ? "rgba(42, 106, 255, 0.05)" : "transparent",
        overflow: "hidden",
      }}
    >
      {/* 1. 썸네일 영역: 파일 형식 및 OCR 상태에 따라 다르게 렌더링 */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: "100%",
          height: "140px",
          background: "#F2F2F2",
          boxShadow: "4px 4px 20px 0px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* 체크박스 (선택 모드일 때) */}
        {isSelectMode && (
          <div className="absolute top-[12px] left-[12px] z-10 flex items-center justify-center">
            {isSelected ? (
              <StorageCheckboxCheckedIcon />
            ) : (
              <StorageCheckboxUncheckedIcon />
            )}
          </div>
        )}

        {/* 실제 파일 미리보기 로직 */}
        <div className="flex h-full w-full items-center justify-center p-2">
          {ocrStatus === "processing" ? (
            // 분석 중일 때 보여줄 로딩 뷰
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner size={40} />
              <p className="text-[12px] font-medium text-blue-600">
                분석 중...
              </p>
            </div>
          ) : fileUrl ? (
            // 완료 상태일 때 파일 타입별 렌더링
            mimeType === "application/pdf" ? (
              <PdfPreview
                fileUrl={fileUrl}
                width={120}
              />
            ) : (
              <img
                src={fileUrl}
                alt={label}
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <p className="text-[13px] text-gray-400">이미지 없음</p>
          )}
        </div>

        {/* 2. 업로드 배지: source 필드값에 따라 색상 변경 */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            display: "flex",
            height: "20px",
            padding: "0 8px",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "10px",
            background: type === "upload" ? "#003880" : "#E2A242",
            zIndex: 10,
          }}
        >
          <span className="font-['Pretendard'] text-[10px] font-bold whitespace-nowrap text-white">
            {badgeText}
          </span>
        </div>
      </div>

      {/* 3. 파일명 영역 */}
      <div
        className="flex items-center"
        style={{
          width: "100%",
          height: "40px",
          background: "#FFF",
          borderTop: "0.5px solid #D1D6DE",
          padding: "8px 12px",
        }}
      >
        <p className="truncate font-['Pretendard'] text-[14px] font-medium text-black">
          {label}
        </p>
      </div>
    </div>
  );
};
