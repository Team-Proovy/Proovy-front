import { NavLink } from "react-router-dom";
import { useNoteList } from "@/features/notes/hooks/useNotes";

interface RecentNote {
  id: string;
  title: string;
}

interface RecentNotesProps {
  isCollapsed: boolean;
}

/**
 * RecentNotes - 최근 노트 목록
 *
 * 사이드바 저장소 아래에 표시
 * 사이드바가 접히면 숨김
 */
export const RecentNotes = ({ isCollapsed }: RecentNotesProps) => {
  // MSW 목 데이터 연결
  const { data, isLoading, error } = useNoteList({
    size: 8,
    enabled: !isCollapsed,
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className={`w-[240px] px-5 pb-4 transition-opacity duration-300 ease-in-out ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="mb-2 px-3 text-[12px] font-medium text-[#454545]">
          최근 노트
        </p>
        <div className="flex flex-col gap-2 px-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[24px] animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div
        className={`w-[240px] px-5 pb-4 transition-opacity duration-300 ease-in-out ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="px-3 text-[12px] text-red-500">
          노트를 불러올 수 없습니다
        </p>
      </div>
    );
  }

  // API 응답을 컴포넌트 형식에 맞게 변환
  const recentNotes: RecentNote[] =
    data?.notes.map((note) => ({
      id: String(note.noteId),
      title: note.title,
    })) ?? [];

  if (recentNotes.length === 0) return null;

  return (
    <div
      className={`w-[240px] px-5 pb-4 transition-opacity duration-300 ease-in-out ${
        isCollapsed ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* 섹션 타이틀 */}
      <p className="mb-2 px-3 text-[12px] font-medium text-[#454545]">
        최근 노트
      </p>

      {/* 노트 리스트 */}
      <ul className="flex flex-col gap-0.5 pr-3">
        {recentNotes.map((note) => (
          <RecentNoteItem
            key={note.id}
            note={note}
          />
        ))}
      </ul>
    </div>
  );
};

// 개별 노트 아이템
const RecentNoteItem = ({ note }: { note: RecentNote }) => {
  return (
    <li>
      <NavLink
        to={`/app/chat/${note.id}`}
        className={({ isActive }) =>
          `block truncate rounded-lg py-[6px] pl-[12px] text-[14px] leading-[160%] font-bold tracking-[-0.05em] text-[#454545] transition-colors ${
            isActive ? "mr-[-6px] bg-[#EBEBEB]" : "hover:bg-[#F5F5F5]"
          }`
        }
      >
        {note.title}
      </NavLink>
    </li>
  );
};
