import { NavLink } from "react-router-dom";

interface RecentNote {
  id: string;
  title: string;
}

interface RecentNotesProps {
  isCollapsed: boolean;
}

// TODO: 실제 API 연동 시 교체
const MOCK_RECENT_NOTES: RecentNote[] = [
  { id: "1", title: "채팅 제목이 테스트1인..." },
  { id: "2", title: "채팅 제목이 테스트1인..." },
  { id: "3", title: "채팅 제목이 테스트1인..." },
  { id: "4", title: "채팅 제목이 테스트1인..." },
  { id: "5", title: "채팅 제목이 테스트1인..." },
];

/**
 * RecentNotes - 최근 노트 목록
 *
 * 사이드바 저장소 아래에 표시
 * 사이드바가 접히면 숨김
 */
export const RecentNotes = ({ isCollapsed }: RecentNotesProps) => {
  // 사이드바가 접힌 상태면 표시하지 않음
  if (isCollapsed) return null;

  // TODO: useQuery로 최근 노트 목록 fetch
  const recentNotes = MOCK_RECENT_NOTES;

  if (recentNotes.length === 0) return null;

  return (
    <div className="px-2 pb-4">
      {/* 섹션 타이틀 */}
      <p className="mb-2 px-3 text-[12px] font-medium text-[#999]">최근 노트</p>

      {/* 노트 리스트 */}
      <ul className="flex flex-col gap-0.5">
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
        to={`/app/note/${note.id}`}
        className={({ isActive }) =>
          `block truncate rounded-lg px-3 py-2 text-[14px] transition-colors ${
            isActive
              ? "bg-[#F0F0F0] font-medium text-[#333]"
              : "text-[#666] hover:bg-[#F5F5F5]"
          }`
        }
      >
        {note.title}
      </NavLink>
    </li>
  );
};
