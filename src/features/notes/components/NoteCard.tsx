/**
 * NoteCard - 개별 노트 카드 (선택 모드 / 일반 모드)
 */

import { Link } from "react-router-dom";
import type { NoteDto } from "../api/notes_types";

interface NoteCardProps {
  note: NoteDto;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
}

const CheckboxIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.5 3.5L5.25 10.5L2.5 7.5"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NoteThumbnail = ({
  thumbnailUrl,
  title,
}: {
  thumbnailUrl: string | null;
  title: string;
}) => (
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

const NoteInfo = ({
  title,
  createdAt,
  lastUsedAt,
}: {
  title: string;
  createdAt: string;
  lastUsedAt: string;
}) => (
  <div className="flex h-[80px] w-full flex-col items-start justify-center rounded-b-[12px] border-t-[0.5px] border-[#D1D6DE] bg-white px-[16px] py-[8px]">
    <div className="flex w-full flex-col gap-[8px]">
      <h3 className="line-clamp-1 text-[14px] leading-[20px] font-medium text-black">
        {title}
      </h3>
      <div className="flex flex-col items-start gap-0 text-[11px] leading-[18px] font-normal text-[#6D6D6D]">
        <p>생성: {new Date(createdAt).toLocaleDateString("ko-KR")}</p>
        <p>최근 사용: {new Date(lastUsedAt).toLocaleDateString("ko-KR")}</p>
      </div>
    </div>
  </div>
);

export const NoteCard = ({
  note,
  isSelectMode,
  isSelected,
  onToggleSelection,
}: NoteCardProps) => {
  if (isSelectMode) {
    return (
      <button
        onClick={() => onToggleSelection(note.noteId)}
        aria-pressed={isSelected}
        aria-label={`${note.title} ${isSelected ? "선택됨" : "선택 안됨"}`}
        className={`group relative flex h-[229px] w-[271px] flex-col rounded-[12px] text-left transition-colors ${
          isSelected
            ? "border-[1.5px] border-[#2A6AFF] bg-[#F1F4F8]"
            : "border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] hover:bg-[#E8ECF1]"
        }`}
        type="button"
      >
        {/* 체크박스 */}
        <div
          className={`absolute top-[12px] right-[12px] z-30 flex h-[20px] w-[20px] items-center justify-center rounded-[4px] border-[1.5px] transition-colors ${
            isSelected
              ? "border-[#2A6AFF] bg-[#2A6AFF]"
              : "border-[#D1D6DE] bg-white"
          }`}
        >
          {isSelected && <CheckboxIcon />}
        </div>

        <NoteThumbnail
          thumbnailUrl={note.thumbnailUrl}
          title={note.title}
        />
        <NoteInfo
          title={note.title}
          createdAt={note.createdAt}
          lastUsedAt={note.lastUsedAt}
        />
      </button>
    );
  }

  return (
    <Link
      to={`/app/chat/${note.noteId}`}
      className="group flex h-[229px] w-[271px] flex-col rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] transition-colors hover:bg-[#E8ECF1]"
    >
      <NoteThumbnail
        thumbnailUrl={note.thumbnailUrl}
        title={note.title}
      />
      <NoteInfo
        title={note.title}
        createdAt={note.createdAt}
        lastUsedAt={note.lastUsedAt}
      />
    </Link>
  );
};
