import { StorageChevronIcon } from "../../../shared/components/icons/StorageIcons";
import { NoteCard } from "./NoteCard";
import { useStorageStore } from "../store/useStorageStore";

interface Note {
  id: number;
  label: string;
  type: "업로드" | "AI 생성";
}

interface NoteGroupProps {
  title: string;
  notes: Note[];
  isOpen: boolean;
  onToggle: () => void;
}

export const NoteGroup = ({
  title,
  notes,
  isOpen,
  onToggle,
}: NoteGroupProps) => {
  const { isSelectMode, selectedIds, toggleIdSelection } = useStorageStore();

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className="flex items-center justify-between transition-colors"
        style={{
          display: "flex",
          width: "820px",
          maxWidth: "100%",
          height: "40px",
          padding: "8px 20px",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          borderRadius: "12px",
          border: "0.5px solid #C6C6C6",
          background: "#F5F5F5",
        }}
      >
        <div className="flex items-center">
          <StorageChevronIcon isOpen={isOpen} />
          <span
            className="ml-[28px] font-['Pretendard']"
            style={{
              color: "#000",
              fontSize: "15px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "22px",
              letterSpacing: "-0.001px",
            }}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-[10px] font-['Pretendard']">
          <span
            style={{
              color: "#000",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "20px",
            }}
          >
            노트 용량
          </span>
          <div
            style={{
              display: "flex",
              width: "75px",
              height: "5px",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRadius: "10px",
              border: "0.5px solid #C6C6C6",
              background: "#FFF",
              overflow: "hidden",
            }}
          >
            <div
              className="h-full bg-[#2A6AFF]"
              style={{ width: "48%" }}
            />
          </div>
          <span
            style={{
              color: "#000",
              fontSize: "13px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "18px",
            }}
          >
            240/500MB
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="mt-[20px] flex flex-wrap gap-[20px]">
          {notes.map((note) => {
            return (
              <NoteCard
                key={note.id}
                label={note.label}
                type={note.type}
                isSelected={selectedIds.includes(note.id)}
                isSelectMode={isSelectMode}
                onSelect={() => toggleIdSelection(note.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
