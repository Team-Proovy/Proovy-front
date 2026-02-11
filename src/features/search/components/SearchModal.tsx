import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchInput from "./SearchInput";
import { ChatHistorySection } from "./ChatHistorySection";
import { NewChattingIcon } from "@/shared/components/icons/ChattingPageIcons";
import { useConversationSearch } from "../hooks/useConversationSearch";
import { useNoteList } from "@/features/notes/hooks/useNotes";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 날짜 라벨 생성 유틸 */
const getDateLabel = (dateStr: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(dateStr);
  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.floor(
    (today.getTime() - dateOnly.getTime()) / 86400000,
  );

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays <= 7) return "지난 7일";
  if (diffDays <= 30) return "지난 30일";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

interface GroupItem {
  id: string;
  title: string;
  noteId: number;
  preview?: string;
}

/** 항목들을 날짜별로 그룹화 */
const groupItemsByDate = (items: { dateStr: string; item: GroupItem }[]) => {
  const groups: Record<string, GroupItem[]> = {};
  const order: string[] = [];

  for (const { dateStr, item } of items) {
    const label = getDateLabel(dateStr);
    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(item);
  }

  return order.map((date) => ({ date, chats: groups[date] }));
};

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 모달 닫힐 때 검색어 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const isSearching = debouncedQuery.trim().length >= 2;

  // ── 기본 상태: 최근 노트 목록 ──
  const { data: noteListData, isLoading: isNoteListLoading } = useNoteList({
    size: 20,
    sort: "lastUsedAt,desc",
    enabled: isOpen && !isSearching,
  });

  // 최근 노트를 날짜별 그룹으로 변환
  const recentNoteGroups = useMemo(() => {
    if (!noteListData?.notes) return [];
    return groupItemsByDate(
      noteListData.notes.map((note) => ({
        dateStr: note.lastUsedAt,
        item: {
          id: String(note.noteId),
          title: note.title,
          noteId: note.noteId,
        },
      })),
    );
  }, [noteListData]);

  // ── 검색 상태: 대화 검색 API ──
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useConversationSearch(
    {
      query: debouncedQuery,
      size: 30,
    },
    { enabled: isOpen && isSearching },
  );

  const searchGroups = useMemo(() => {
    if (!searchData?.conversations) return [];
    return groupItemsByDate(
      searchData.conversations.map((conv) => ({
        dateStr: conv.createdAt,
        item: {
          id: String(conv.conversationId),
          title: conv.noteTitle,
          noteId: conv.noteId,
          preview:
            conv.userMessage.content.length > 80
              ? conv.userMessage.content.slice(0, 80) + "…"
              : conv.userMessage.content,
        },
      })),
    );
  }, [searchData]);

  // 결과 클릭 → 해당 노트 채팅방으로 이동
  const handleResultClick = useCallback(
    (noteId: number) => {
      onClose();
      navigate(`/app/chat/${noteId}`);
    },
    [navigate, onClose],
  );

  // 새 채팅 → 홈으로 이동
  const handleNewChat = useCallback(() => {
    onClose();
    navigate("/app/home");
  }, [navigate, onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex h-[495px] w-[836px] flex-col overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={onClose}
        />
        <div className="mx-6 h-px bg-gray-200" />

        <div className="custom-scrollbar flex flex-1 flex-col gap-[12px] overflow-y-auto p-4 pr-4">
          {/* 새 채팅 버튼 */}
          <button
            onClick={handleNewChat}
            className="group flex h-[60px] min-h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]"
          >
            <div className="pl-2">
              <NewChattingIcon
                className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                color="currentColor"
              />
            </div>
            <span className="text-[18px] font-semibold text-[#2F3440]">
              새 채팅
            </span>
          </button>

          {/* 검색 모드 vs 기본 모드 */}
          {isSearching ? (
            /* ── 검색 결과 ── */
            isSearchLoading ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <LoadingSpinner size={32} />
              </div>
            ) : isSearchError ? (
              <div className="flex flex-1 items-center justify-center py-12 text-sm text-red-400">
                검색 중 오류가 발생했습니다.
              </div>
            ) : searchGroups.length > 0 ? (
              <>
                {searchData?.searchMetadata && (
                  <p className="px-3 text-[12px] text-[#9CA4B0]">
                    검색 결과 {searchData.searchMetadata.totalMatches}건
                  </p>
                )}
                {searchGroups.map((section) => (
                  <ChatHistorySection
                    key={section.date}
                    dateLabel={section.date}
                    items={section.chats}
                    onItemClick={handleResultClick}
                    searchQuery={debouncedQuery}
                  />
                ))}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-12 text-sm text-[#9CA4B0]">
                &quot;{debouncedQuery}&quot;에 대한 검색 결과가 없습니다.
              </div>
            )
          ) : /* ── 기본: 최근 노트 목록 ── */
          isNoteListLoading ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : recentNoteGroups.length > 0 ? (
            recentNoteGroups.map((section) => (
              <ChatHistorySection
                key={section.date}
                dateLabel={section.date}
                items={section.chats}
                onItemClick={handleResultClick}
              />
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center py-12 text-sm text-[#9CA4B0]">
              아직 노트가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
