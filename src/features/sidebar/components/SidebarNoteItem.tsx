import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useUpdateNoteTitle } from "@/features/notes/hooks/useNotes";
import type { NoteDto } from "@/features/notes/api/notes_types";

interface SidebarNoteItemProps {
  note: NoteDto;
  onDeleteRequest: () => void;
}

export const SidebarNoteItem = ({
  note,
  onDeleteRequest,
}: SidebarNoteItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const isComposingRef = useRef(false);
  const { mutateAsync: updateTitle } = useUpdateNoteTitle();

  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleRenameSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const trimmed = titleInput.trim();
    setIsRenaming(false);
    try {
      if (trimmed && trimmed !== note.title) {
        await updateTitle({ noteId: note.noteId, title: trimmed });
      }
    } catch {
      // 실패 시 note.title이 그대로 표시됨 (자동 롤백)
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isComposingRef.current) {
      e.preventDefault();
      handleRenameSubmit();
    }
    if (e.key === "Escape") {
      setTitleInput(note.title);
      setIsRenaming(false);
    }
  };

  return (
    <li className={`group relative ${isMenuOpen ? "z-20" : "z-0 hover:z-10"}`}>
      {isRenaming ? (
        <div className="flex items-center rounded-lg px-[12px] py-[6px]">
          <input
            ref={inputRef}
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            className="w-full truncate bg-transparent text-[16px] leading-[24px] font-normal text-[#6B7280] outline-none"
          />
        </div>
      ) : (
        <NavLink
          to={`/app/chat/${note.noteId}`}
          state={{ chatEntrySource: "sidebar-recent-notes" }}
          className={({ isActive }) =>
            `block truncate rounded-lg py-[6px] pr-[28px] pl-[12px] text-[16px] leading-[24px] transition-colors ${
              isActive
                ? "mr-[-6px] bg-[#EBEBEB] font-medium text-black"
                : "font-normal text-[#6B7280] hover:bg-[#F5F5F5] hover:text-black"
            }`
          }
        >
          {note.title}
        </NavLink>
      )}

      {!isRenaming && (
        <div
          ref={menuRef}
          className="absolute top-1/2 right-[-6px] -translate-y-1/2"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className="flex h-[22px] w-[22px] items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#E8E8E8]"
            aria-label="더보기"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="2.5"
                cy="7"
                r="1.2"
                fill="#454545"
              />
              <circle
                cx="7"
                cy="7"
                r="1.2"
                fill="#454545"
              />
              <circle
                cx="11.5"
                cy="7"
                r="1.2"
                fill="#454545"
              />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 z-50 mt-1 flex w-[105px] flex-col items-center rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white p-[8px] shadow-[4px_4px_20px_0px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => {
                  setTitleInput(note.title);
                  setIsRenaming(true);
                  setIsMenuOpen(false);
                }}
                className="w-full rounded px-3 py-[6px] text-left text-[13px] leading-[24px] font-normal text-[#6B7280] transition-colors hover:text-black active:font-medium active:text-black"
              >
                수정하기
              </button>
              <button
                onClick={() => {
                  onDeleteRequest();
                  setIsMenuOpen(false);
                }}
                className="w-full rounded px-3 py-[6px] text-left text-[13px] leading-[24px] font-normal text-[#6B7280] transition-colors hover:text-black active:font-medium active:text-black"
              >
                삭제하기
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};
