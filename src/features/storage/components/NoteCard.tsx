import {
  StorageCheckboxUncheckedIcon,
  StorageCheckboxCheckedIcon,
} from "../../../shared/components/icons/StorageIcons";

import { PdfPreview } from "../../../shared/components/pdf-preview/PdfPreview";

interface NoteCardProps {
  label: string;
  type: "업로드" | "AI 생성";
  fileUrl?: string; // 파일 URL이 있으면 미리보기 표시
  mimeType?: string; // 파일 타입
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: () => void;
}

export const NoteCard = ({
  label,
  type,
  fileUrl,
  mimeType,
  isSelected,
  isSelectMode,
  onSelect,
}: NoteCardProps) => {
  const isUpload = type === "업로드";
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType?.startsWith("image/");

  return (
    <div
      onClick={() => isSelectMode && onSelect()}
      className="group relative flex cursor-pointer flex-col overflow-hidden transition-transform hover:scale-[1.02]"
      style={{
        width: "148px",
        height: "129px",
        borderRadius: "10px",
        border: isSelected ? "1.5px solid #2A6AFF" : "1px solid #C6C6C6",
        background: "#FFF",
      }}
    >
      {/* 1. 미리보기 영역 (배경) */}
      <div className="relative flex h-[129px] w-full items-center justify-center overflow-hidden bg-gray-50">
        {fileUrl && isPdf ? (
          <div className="pointer-events-none h-full w-full">
            {/* PDF 미리보기: 상호작용 막고 꽉 차게 표시 */}
            <div className="origin-top scale-100">
              <PdfPreview
                fileUrl={fileUrl}
                width={148}
              />
            </div>
          </div>
        ) : fileUrl && isImage ? (
          <img
            src={fileUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          /* 기본 플레이스홀더: 기존 UI 유지 */
          <div className="h-full w-full" />
        )}
      </div>

      {/* 2. 하단 라벨 (미리보기가 있든 없든 항상 하단에 위치) */}
      <div
        className="absolute bottom-0 left-0 flex w-full flex-col justify-end bg-gradient-to-t from-white/90 to-transparent p-3 pt-6"
        style={{
          height: "auto",
        }}
      >
        <span
          className="truncate font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black"
          style={{
            color: "#000",
          }}
        >
          {label}
        </span>
      </div>

      {/* 3. 체크박스 오버레이 */}
      {isSelectMode && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            zIndex: 10,
          }}
        >
          {isSelected ? (
            <StorageCheckboxCheckedIcon />
          ) : (
            <StorageCheckboxUncheckedIcon />
          )}
        </div>
      )}

      {/* 4. 타입 배지 (우상단) */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          display: "flex",
          width: "48px",
          height: "20px",
          padding: "0 8px",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "10px",
          background: isUpload ? "#003880" : "#E2A242",
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: "#FFF",
            textAlign: "center",
            fontFamily: "Pretendard",
            fontSize: "10px",
            fontWeight: 700,
          }}
          className="whitespace-nowrap"
        >
          {type}
        </span>
      </div>
    </div>
  );
};
