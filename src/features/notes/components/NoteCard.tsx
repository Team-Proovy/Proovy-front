/**
 * NoteCard - 개별 노트 카드 (선택 모드 / 일반 모드)
 */

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useUpdateNoteTitle } from "../hooks/useNotes";
import {
  NoteEditIcon,
  NoteCheckboxIcon,
} from "@/shared/components/icons/NotesIcons";
import type { NoteDto } from "../api/notes_types";

interface NoteCardProps {
  note: NoteDto;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
}

export const NoteCard = ({
  note,
  isSelectMode,
  isSelected,
  onToggleSelection,
}: NoteCardProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const { mutateAsync: updateNoteTitle, isPending } = useUpdateNoteTitle();

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(note.title);
    }
  }, [note.title, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftTitle(note.title);
    setIsEditing(false);
  };

  const handleSubmitEdit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const nextTitle = draftTitle.trim();

    if (!nextTitle || nextTitle === note.title) {
      handleCancelEdit();
      return;
    }

    isSubmittingRef.current = true;

    try {
      await updateNoteTitle({ noteId: note.noteId, title: nextTitle });
    } finally {
      isSubmittingRef.current = false;
      setIsEditing(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSubmitEdit();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  const handleInputClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const handleInputMouseDown = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const handleCardActivate = () => {
    if (isEditing) {
      return;
    }

    if (isSelectMode) {
      onToggleSelection(note.noteId);
      return;
    }

    navigate(`/app/chat/${note.noteId}`, {
      state: { chatEntrySource: "notes-page-card" },
    });
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleCardActivate();
  };

  const noteContent = (
    <>
      <NoteThumbnail
        thumbnailUrl={note.thumbnailUrl}
        title={note.title}
      />
      <NoteInfo
        title={note.title}
        draftTitle={draftTitle}
        createdAt={note.createdAt}
        lastUsedAt={note.lastUsedAt}
        isEditing={isEditing}
        isSaving={isPending}
        inputRef={inputRef}
        onStartEdit={handleStartEdit}
        onDraftChange={setDraftTitle}
        onSubmitEdit={handleSubmitEdit}
        onInputClick={handleInputClick}
        onInputMouseDown={handleInputMouseDown}
        onKeyDown={handleKeyDown}
      />
    </>
  );

  if (isSelectMode) {
    return (
      <div
        onClick={handleCardActivate}
        onKeyDown={handleCardKeyDown}
        aria-pressed={isSelected}
        aria-label={`${note.title} ${isSelected ? "선택됨" : "선택 안됨"}`}
        role="button"
        tabIndex={0}
        className={`group relative flex h-[229px] w-[271px] cursor-pointer flex-col rounded-[12px] text-left transition-colors transition-transform hover:scale-[1.02] ${
          isSelected
            ? "border-[1.5px] border-[#2A6AFF] bg-[#F1F4F8]"
            : "border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] hover:bg-[#E8ECF1]"
        }`}
      >
        {/* 체크박스 */}
        <div
          className={`absolute top-[12px] right-[12px] z-30 flex h-[20px] w-[20px] items-center justify-center rounded-[4px] border-[1.5px] transition-colors ${
            isSelected
              ? "border-[#2A6AFF] bg-[#2A6AFF]"
              : "border-[#D1D6DE] bg-white"
          }`}
        >
          {isSelected && (
            <NoteCheckboxIcon className="h-[14px] w-[14px] text-white" />
          )}
        </div>

        {noteContent}
      </div>
    );
  }

  return (
    <div
      onClick={handleCardActivate}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`${note.title} 노트로 이동`}
      className="group flex h-[229px] w-[271px] cursor-pointer flex-col rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] transition-colors transition-transform hover:scale-[1.02] hover:bg-[#E8ECF1]"
    >
      {noteContent}
    </div>
  );
};

function NoteThumbnail({
  thumbnailUrl,
  title,
}: {
  thumbnailUrl: string | null;
  title: string;
}) {
  return (
    <div className="h-[149px] w-full overflow-hidden rounded-t-[12px] bg-[#E8ECF1]">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          width={271}
          height={149}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#F1F4F8]" />
      )}
    </div>
  );
}

function NoteInfo({
  title,
  draftTitle,
  createdAt,
  lastUsedAt,
  isEditing,
  isSaving,
  inputRef,
  onStartEdit,
  onDraftChange,
  onSubmitEdit,
  onInputClick,
  onInputMouseDown,
  onKeyDown,
}: {
  title: string;
  draftTitle: string;
  createdAt: string;
  lastUsedAt: string;
  isEditing: boolean;
  isSaving: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onStartEdit: (event: MouseEvent<HTMLButtonElement>) => void;
  onDraftChange: (value: string) => void;
  onSubmitEdit: () => void;
  onInputClick: (event: MouseEvent<HTMLInputElement>) => void;
  onInputMouseDown: (event: MouseEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex h-[80px] w-full flex-col items-start justify-center rounded-b-[12px] border-t-[0.5px] border-[#D1D6DE] bg-white px-[16px] py-[8px]">
      <div className="flex w-full flex-col gap-[8px]">
        <div className="flex w-full items-center justify-between gap-[8px]">
          {isEditing ? (
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(event) => onDraftChange(event.target.value)}
              onBlur={onSubmitEdit}
              onKeyDown={onKeyDown}
              onClick={onInputClick}
              onMouseDown={onInputMouseDown}
              disabled={isSaving}
              className="h-[24px] w-full flex-1 rounded-[6px] border border-[#D1D6DE] bg-white px-2 text-[14px] leading-[20px] font-medium text-black outline-none focus:border-[#2A6AFF]"
            />
          ) : (
            <h3 className="line-clamp-1 flex-1 text-[14px] leading-[20px] font-medium text-black">
              {title}
            </h3>
          )}
          {!isEditing && (
            <button
              type="button"
              onClick={onStartEdit}
              className="flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded-[6px] text-[#9CA4B0] transition-colors hover:bg-[#E8ECF1] hover:text-[#2A6AFF]"
              aria-label="노트 제목 수정"
            >
              <NoteEditIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-start gap-0 text-[11px] leading-[18px] font-normal text-[#6D6D6D]">
          <p>생성: {new Date(createdAt).toLocaleDateString("ko-KR")}</p>
          <p>최근 사용: {new Date(lastUsedAt).toLocaleDateString("ko-KR")}</p>
        </div>
      </div>
    </div>
  );
}
