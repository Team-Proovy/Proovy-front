import type { ChatAssetDto } from "../../types/editor_types";

interface FileDropdownMenuProps {
  assets: ChatAssetDto[];
  onSelect: (asset: ChatAssetDto) => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
  focusedIndex?: number | null;
  onFocusChange?: (index: number) => void;
  isLoading?: boolean;
}

/** 파일 크기 포맷 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/** 파일 타입별 아이콘 색상 */
const getFileTypeColor = (fileType: string): string => {
  switch (fileType) {
    case "PDF":
      return "bg-red-400";
    case "DOCX":
      return "bg-blue-400";
    case "IMAGE":
      return "bg-green-400";
    case "CODE":
      return "bg-purple-400";
    default:
      return "bg-gray-400";
  }
};

export const FileDropdownMenu = ({
  assets,
  onSelect,
  onClose,
  className = "",
  style,
  focusedIndex = null,
  onFocusChange,
  isLoading = false,
}: FileDropdownMenuProps) => {
  return (
    <div
      className={`animate-in fade-in slide-in-from-top-2 absolute z-50 flex w-[240px] flex-col gap-1 rounded-xl border-[0.5px] border-[#DFDFDF] bg-white p-2 shadow-lg duration-200 ${className}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <div className="flex h-[32px] items-center justify-center text-[13px] text-[#9CA4B0]">
          파일 목록 불러오는 중...
        </div>
      ) : assets.length === 0 ? (
        <div className="flex h-[32px] items-center justify-center text-[13px] text-[#9CA4B0]">
          파일이 없습니다
        </div>
      ) : (
        assets.map((asset, index) => {
          const isFocused = focusedIndex === index;
          const styleClass = isFocused
            ? "bg-[#2A6AFF] text-white"
            : "bg-transparent text-black hover:bg-[#2A6AFF]/50 hover:text-white";

          return (
            <button
              key={asset.assetId}
              type="button"
              className={`flex h-[36px] w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] font-medium transition-colors duration-200 ${styleClass}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => onFocusChange?.(index)}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(asset);
                onClose();
              }}
            >
              {/* 파일 타입 뱃지 */}
              <div
                className={`flex h-5 w-8 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${getFileTypeColor(asset.fileType)}`}
              >
                {asset.fileType}
              </div>
              {/* 파일명 */}
              <span className="min-w-0 flex-1 truncate">{asset.fileName}</span>
              {/* 파일 크기 */}
              <span
                className={`shrink-0 text-[11px] ${isFocused ? "text-white/70" : "text-[#9CA4B0]"}`}
              >
                {formatFileSize(asset.fileSize)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
};
