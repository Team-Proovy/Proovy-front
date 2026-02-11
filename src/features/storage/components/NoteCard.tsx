import { LoadingSpinner } from "@/shared/components/loading-spinner";
import {
  StorageCheckboxUncheckedIcon,
  StorageCheckboxCheckedIcon,
} from "../../../shared/components/icons/StorageIcons";
import {
  getBadgeColor,
  getBadgeText,
  type AssetSourceType,
  type AssetCategoryType,
  type OcrStatusType,
} from "../utils/asset-mapper";

interface NoteCardProps {
  label: string; // 파일명
  type: AssetSourceType; // 파일 출처 ("upload" | "ai")
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: () => void;
  thumbnailUrl?: string | null; // 썸네일 URL (백엔드 제공)
  mimeType?: string;
  fileCategory?: AssetCategoryType;
  ocrStatus?: OcrStatusType;
  onClick?: () => void;
}

export const NoteCard = ({
  label,
  type,
  isSelected,
  isSelectMode,
  onSelect,
  thumbnailUrl,
  mimeType,
  fileCategory,
  ocrStatus = "completed",
  onClick,
}: NoteCardProps) => {
  // 파일 출처에 따른 배지 정보
  const badgeText = getBadgeText(type);
  const badgeColor = getBadgeColor(type);

  // 썸네일 렌더링 로직
  const renderThumbnail = () => {
    // OCR 처리 중일 때
    if (ocrStatus === "pending" || ocrStatus === "processing") {
      return (
        <div className="flex flex-col items-center gap-2">
          <LoadingSpinner size={40} />
          <p className="text-[12px] font-medium text-blue-600">분석 중...</p>
        </div>
      );
    }

    // 썸네일 URL이 있으면 항상 이미지로 렌더링 (PDF 썸네일 포함)
    if (thumbnailUrl) {
      return (
        <img
          src={thumbnailUrl}
          alt={label}
          className="h-full w-full object-contain"
          onError={(e) => {
            // 이미지 로드 실패 시 fallback
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement!.innerHTML =
              '<p class="text-[13px] text-gray-400">썸네일 없음</p>';
          }}
        />
      );
    }

    // 썸네일이 없을 때 파일 타입에 따른 기본 아이콘 표시
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
          {fileCategory === "document" || mimeType === "application/pdf" ? (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <p className="text-[11px] text-gray-400">썸네일 없음</p>
      </div>
    );
  };

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
      {/* 썸네일 영역 */}
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

        {/* 썸네일 렌더링 */}
        <div className="flex h-full w-full items-center justify-center p-2">
          {renderThumbnail()}
        </div>

        {/* 업로드/AI 생성 배지 */}
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
            background: badgeColor,
            zIndex: 10,
          }}
        >
          <span className="font-['Pretendard'] text-[10px] font-bold whitespace-nowrap text-white">
            {badgeText}
          </span>
        </div>
      </div>

      {/* 파일명 영역 */}
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
