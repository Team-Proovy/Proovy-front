import {
  StorageCheckboxUncheckedIcon,
  StorageCheckboxCheckedIcon,
} from "../../../shared/components/icons/StorageIcons";

interface NoteCardProps {
  label: string;
  type: "업로드" | "AI 생성";
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
  const isUpload = type === "업로드";

  return (
    <div
      onClick={() => isSelectMode && onSelect()}
      className="group relative flex cursor-pointer transition-transform hover:scale-[1.02]"
      style={{
        width: "148px",
        height: "129px",
        display: "flex",
        padding: "12px",
        alignItems: "flex-end",
        gap: "10px",
        borderRadius: "10px",
        border: isSelected ? "1.5px solid #2A6AFF" : "1px solid #C6C6C6",
        background: "#FFF",
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
          }}
        >
          {isSelected ? (
            <StorageCheckboxCheckedIcon />
          ) : (
            <StorageCheckboxUncheckedIcon />
          )}
        </div>
      )}
      <span
        className="font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black"
        style={{
          color: "#000",
        }}
      >
        {label}
      </span>
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
          gap: "10px",
          borderRadius: "10px",
          background: isUpload ? "#003880" : "#E2A242",
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
  );
};
