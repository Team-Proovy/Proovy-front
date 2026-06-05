import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useInfiniteNoteList,
  useDeleteNote,
} from "@/features/notes/hooks/useNotes";
import { SidebarNoteItem } from "./SidebarNoteItem";
import { StorageChevronIcon } from "@/shared/components/icons/StorageIcons";
import type { NoteListParams } from "@/features/notes/api/notes_types";

type SortValue = NonNullable<NoteListParams["sort"]>;

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: "최근 사용 순", value: "lastUsedAt,desc" },
  { label: "최신 생성 순", value: "createdAt,desc" },
  { label: "이름 순", value: "title,asc" },
];

interface RecentNotesProps {
  isCollapsed: boolean;
}

export const RecentNotes = ({ isCollapsed }: RecentNotesProps) => {
  const [sort, setSort] = useState<SortValue>("lastUsedAt,desc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNoteList({ sort, size: 20 });

  const { mutateAsync: deleteNote, isPending: isDeleting } = useDeleteNote();

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSortOpen]);

  const notes = data?.pages.flatMap((page) => page.notes) ?? [];

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return;
    try {
      await deleteNote(deleteTargetId);
      setDeleteTargetId(null);
    } catch {
      // 실패 시 모달 유지 - 사용자가 재시도하거나 취소 가능
    }
  };

  return (
    <>
      <style>{`
        .recent-notes-list {
          scrollbar-width: none;
        }
        .recent-notes-list::-webkit-scrollbar {
          width: 6px;
          display: none;
        }
        .recent-notes-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .recent-notes-list::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 3px;
        }
        .recent-notes-list:hover {
          scrollbar-width: thin;
          scrollbar-color: #d0d0d0 transparent;
        }
        .recent-notes-list:hover::-webkit-scrollbar {
          display: block;
        }
        .recent-notes-list:hover::-webkit-scrollbar-thumb {
          background-color: #d0d0d0;
          border-radius: 0px;
        }
      `}</style>

      <div
        className={`flex h-full w-[240px] flex-col px-5 pb-4 transition-opacity duration-300 ease-in-out ${
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={isCollapsed}
      >
        {/* 헤더: 정렬 드롭다운 + 접기 버튼 */}
        <div className="mb-[16px] flex w-[192px] flex-shrink-0 items-center justify-between">
          {/* 텍스트 클릭 → 정렬 모달 */}
          <div
            ref={sortRef}
            className="relative"
          >
            <button
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="pl-[8px] text-[16px] leading-[24px] font-semibold text-black"
            >
              최근 노트 목록
            </button>
            {isSortOpen && (
              <div className="absolute top-full left-0 z-20 mt-1 w-[124px] rounded-lg border border-[#E3E7ED] bg-white py-1 shadow-lg">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSort(option.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-3 py-[6px] text-left text-[13px] transition-colors hover:bg-[#F5F5F5] ${
                      sort === option.value
                        ? "font-semibold text-[#2A6AFF]"
                        : "text-[#454545]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 화살표 클릭 → 노트 목록 접기/펴기 */}
          <button
            onClick={() => setIsNotesCollapsed((prev) => !prev)}
            className="flex h-[22px] w-[22px] items-center justify-center"
          >
            <span className="flex h-3 w-3 items-center justify-center overflow-hidden">
              <StorageChevronIcon isOpen={!isNotesCollapsed} />
            </span>
          </button>
        </div>

        {/* 노트 목록 */}
        {!isNotesCollapsed && (
          <ul className="recent-notes-list flex min-h-0 flex-1 flex-col gap-[16px] overflow-x-hidden overflow-y-auto pr-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <li
                  key={`skeleton-${i}`}
                  className="px-3"
                >
                  <div className="h-[30px] animate-pulse rounded bg-gray-200" />
                </li>
              ))
            ) : error ? (
              <li className="px-3 text-[12px] text-red-500">
                노트를 불러올 수 없습니다
              </li>
            ) : notes.length === 0 ? (
              <li className="px-3 text-[12px] text-gray-400">
                최근 노트가 없습니다
              </li>
            ) : (
              notes.map((note) => (
                <SidebarNoteItem
                  key={note.noteId}
                  note={note}
                  onDeleteRequest={() => setDeleteTargetId(note.noteId)}
                />
              ))
            )}

            {/* 무한 스크롤 트리거 */}
            <div
              ref={observerRef}
              className="h-1 flex-shrink-0"
            />
            {isFetchingNextPage && (
              <li className="px-3">
                <div className="h-[30px] animate-pulse rounded bg-gray-200" />
              </li>
            )}
          </ul>
        )}
      </div>

      {/* 단건 삭제 확인 모달 — portal로 body에 마운트해 stacking context 우회 */}
      {deleteTargetId !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#00000033]"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setDeleteTargetId(null);
              }
            }}
          >
            <div className="w-[360px] rounded-[20px] bg-white px-8 py-8 shadow-[0px_10px_40px_rgba(0,0,0,0.1)]">
              <h2 className="text-center text-[22px] leading-[32px] font-semibold text-black">
                이 노트를 삭제하시겠습니까?
              </h2>
              <p className="mt-3 text-center text-[15px] text-[#00000066]">
                삭제된 노트는 복구가 불가능합니다.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  disabled={isDeleting}
                  className="flex h-[48px] flex-1 items-center justify-center rounded-[16px] border border-[#D1D6DE] bg-[#F1F4F8] text-[16px] font-semibold text-[#6B7280] disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex h-[48px] flex-1 items-center justify-center rounded-[16px] bg-[#2A6AFF] text-[16px] font-semibold text-white disabled:opacity-70"
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
