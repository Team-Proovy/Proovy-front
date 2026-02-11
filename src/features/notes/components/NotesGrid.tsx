/**
 * NotesGrid - 노트 목록 그리드 영역
 * - 노트 추가 카드, 노트 카드들, 로딩/빈 상태
 */

import { NotesAddCard } from "./NotesAddCard";
import { NoteCard } from "./NoteCard";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import type { NoteDto } from "../api/notes_types";

interface NotesGridProps {
  notes: NoteDto[];
  isLoading: boolean;
  isSelectMode: boolean;
  selectedIds: number[];
  onToggleSelection: (id: number) => void;
}

export const NotesGrid = ({
  notes,
  isLoading,
  isSelectMode,
  selectedIds,
  onToggleSelection,
}: NotesGridProps) => {
  return (
    <div className="mt-[21px] w-full">
      <div className="grid [grid-template-columns:repeat(2,271px)] gap-[40px] min-[1340px]:[grid-template-columns:repeat(3,271px)]">
        <NotesAddCard />

        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-[40px]">
            <LoadingSpinner size={80} />
          </div>
        ) : notes.length > 0 ? (
          notes.map((note) => (
            <NoteCard
              key={note.noteId}
              note={note}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.includes(note.noteId)}
              onToggleSelection={onToggleSelection}
            />
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center py-[40px]">
            <span className="text-[14px] leading-[20px] text-[#6D6D6D]">
              노트가 없습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
