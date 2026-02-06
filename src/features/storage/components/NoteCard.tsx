import {
  StorageCheckboxUncheckedIcon,
  StorageCheckboxCheckedIcon,
} from "../../../shared/components/icons/StorageIcons";

interface NoteCardProps {
  label: string;
  type: "업로드";
  isSelected: boolean;
  isSelectMode: boolean;
  onSelect: () => void;
}

export const NoteCard = ({
  label,
  type,
  isSelected,
  isSelectMode,
  onSelect,
}: NoteCardProps) => {
  return (
    <div
      onClick={() => isSelectMode && onSelect()}
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
        className="relative flex items-center justify-center"
        style={{
          width: "100%",
          height: "140px",
          background: "#FFF",
          boxShadow: "4px 4px 20px 0px rgba(0, 0, 0, 0.05)",
          padding: "60px 48px",
        }}
      >
        {isSelectMode && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
        <p
          className="font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black"
          style={{
            color: "#000",
          }}
        >
          파일 썸네일
        </p>
        {/* 업로드 배지 */}
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
            background: type === "업로드" ? "#003880" : "#E2A242",
          }}
        >
          <span
            style={{
              color: "#FFF",
              textAlign: "center",
              fontFamily: "Pretendard",
              fontSize: "10px",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "160%",
              letterSpacing: "-0.5px",
            }}
            className="whitespace-nowrap"
          >
            {type}
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
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }}
      >
        <p
          className="truncate font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black"
          style={{
            color: "#000",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
};
