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
    <div className="3xl:max-w-[1360px] mx-auto flex w-full max-w-[520px] flex-col lg:max-w-[800px] 2xl:max-w-[1080px]">
      <button
        onClick={onToggle}
        className="mx-auto flex w-full items-center justify-between rounded-[12px] border border-[#D1D6DE] bg-[#F1F4F8] px-[20px] py-[8px] transition-colors"
        style={{
          display: "flex",
          height: "40px",
          flexShrink: 0,
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
            240/512MB
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="3xl:grid-cols-5 mx-auto mt-[20px] grid w-full grid-cols-2 justify-center gap-x-[40px] gap-y-[20px] lg:grid-cols-3 2xl:grid-cols-4">
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
