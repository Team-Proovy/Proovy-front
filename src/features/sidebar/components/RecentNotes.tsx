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
 * 사이드바에서 모든 노트를 스크롤로 보여줌
 */
export const RecentNotes = ({ isCollapsed }: RecentNotesProps) => {
  // 충분한 양의 노트를 미리 가져옴
  const { data, isLoading, error } = useNoteList({
    size: 100,
    enabled: !isCollapsed,
  });

  // API 응답을 컴포넌트 형식에 맞게 변환
  const recentNotes: RecentNote[] =
    data?.notes.map((note) => ({
      id: String(note.noteId),
      title: note.title,
    })) ?? [];

  return (
    <>
      <style>{`
        /* 기본 상태: 스크롤바 숨김 */
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
        
        /* 호버 상태: 스크롤바 표시 */
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
        className={`flex flex-col h-full w-full px-5 pb-4 transition-opacity duration-300 ease-in-out ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* 섹션 타이틀 */}
        <p className="mb-2 px-3 text-[12px] font-medium text-[#454545] flex-shrink-0">
          최근 노트
        </p>

        {/* 노트 리스트 - 스크롤 활성화 */}
        <ul className="recent-notes-list flex flex-col gap-0.5 pr-3 flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            // 로딩 상태
            [1, 2, 3].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="h-[30px] animate-pulse rounded bg-gray-200"
              />
            ))
          ) : error ? (
            // 에러 상태
            <li className="px-3 text-[12px] text-red-500">
              노트를 불러올 수 없습니다
            </li>
          ) : recentNotes.length === 0 ? (
            // 노트가 없는 경우
            <li className="px-3 text-[12px] text-gray-400">
              최근 노트가 없습니다
            </li>
          ) : (
            // 정상 상태
            recentNotes.map((note) => (
              <RecentNoteItem
                key={note.id}
                note={note}
              />
            ))
          )}
        </ul>
      </div>
    </>
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
