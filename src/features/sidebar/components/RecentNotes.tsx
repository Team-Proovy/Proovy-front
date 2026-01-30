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
  { id: "1", title: "이산수학 과제2 3단원" },
  { id: "2", title: "선형대수 복습" },
  { id: "3", title: "알고리즘 스터디" },
  { id: "4", title: "프로젝트 기획서 작성" },
  { id: "5", title: "리액트 상태관리 패턴" },
  { id: "6", title: "Next.js 13 마이그레이션" },
  { id: "7", title: "테일윈드 디자인 시스템" },
  { id: "8", title: "AWS 배포 파이프라인" },
];

/**
 * RecentNotes - 최근 노트 목록
 *
 * 사이드바 저장소 아래에 표시
 * 사이드바가 접히면 숨김
 */
export const RecentNotes = ({ isCollapsed }: RecentNotesProps) => {
  // 사이드바가 접힌 상태면 표시하지 않음 -> 투명도로 처리
  // if (isCollapsed) return null;

  // TODO: useQuery로 최근 노트 목록 fetch
  const recentNotes = MOCK_RECENT_NOTES;

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
