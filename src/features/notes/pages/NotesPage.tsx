/**
 * NotesPage - 노트 목록 페이지
 *
 * URL: /app/notes
 *
 * 기능:
 * - 전체 노트 목록 표시
 * - 노트 카드 클릭 → /app/chat/:chatId 로 이동
 * - "노트 추가하기" 클릭 → /app/home 으로 이동
 */

import { Link } from "react-router-dom";
import { useState } from "react";

// 아이콘
import { PdfIcon } from "../../../shared/components/icons/HomepageInputIcons";
import { DropdownIcon } from "../../../shared/components/icons/ChatInputIcons";

const ArrowLeftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 12L6 8L10 4"
      stroke="#2F3440"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 4L10 8L6 12"
      stroke="#2F3440"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface Note {
  id: string;
  title: string;
  createdAt: string;
  lastUsedAt: string;
}

type SortOrder =
  | "recentUsed" // 최근 사용 순 (기본값)
  | "createdDesc" // 최신 생성 순
  | "createdAsc" // 오래된 생성 순
  | "nameAsc" // 이름 순
  | "nameDesc"; // 이름 역순

export const NotesPage = () => {
  // TODO: useNotes() 훅으로 노트 목록 fetch
  const mockNotes: Note[] = [
    {
      id: "1",
      title: "미적분 중간고사 정리",
      createdAt: "2025-12-04T00:00:00Z",
      lastUsedAt: "2025-12-06T10:18:00Z",
    },
    {
      id: "2",
      title: "여기는 노트 제목이 오는 위치",
      createdAt: "2025-12-04T00:00:00Z",
      lastUsedAt: "2025-12-06T10:18:00Z",
    },
    {
      id: "3",
      title: "여기는 노트 제목이 오는 위치",
      createdAt: "2025-12-04T00:00:00Z",
      lastUsedAt: "2025-12-06T10:18:00Z",
    },
    {
      id: "4",
      title: "여기는 노트 제목이 오는 위치",
      createdAt: "2025-12-04T00:00:00Z",
      lastUsedAt: "2025-12-06T10:18:00Z",
    },
    {
      id: "5",
      title: "가나다라마가나다라마가나다라마가나다라마",
      createdAt: "2025-12-04T00:00:00Z",
      lastUsedAt: "2025-12-06T10:18:00Z",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const totalNotes = 5;
  const currentNotes = 3;

  const [sortOrder, setSortOrder] = useState<SortOrder>("recentUsed");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: "recentUsed", label: "최근 사용 순" },
    { value: "createdDesc", label: "최신 생성 순" },
    { value: "createdAsc", label: "오래된 생성 순" },
    { value: "nameAsc", label: "이름 순" },
    { value: "nameDesc", label: "이름 역순" },
  ];

  const sortedNotes = [...mockNotes].sort((a, b) => {
    switch (sortOrder) {
      case "recentUsed": {
        // 최근 사용 순: lastUsedAt 내림차순
        return (
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
        );
      }
      case "createdDesc": {
        // 최신 생성 순: createdAt 내림차순
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      case "createdAsc": {
        // 오래된 생성 순: createdAt 오름차순
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      case "nameAsc": {
        // 이름 순: 가나다순
        return a.title.localeCompare(b.title, "ko");
      }
      case "nameDesc": {
        // 이름 역순
        return b.title.localeCompare(a.title, "ko");
      }
      default:
        return 0;
    }
  });

  const handleSelectSort = (value: SortOrder) => {
    setSortOrder(value);
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-white">
      {/* 사이드바를 제외한 나머지 영역에서 가운데 정렬을 위한 컨테이너
          - 좌우 패딩 80px(px-20)을 기준으로 전체 레이아웃을 잡고,
          - 실제 노트 영역(제목/정렬바/그리드/페이지네이션)은
            카드 열 개수(2열/3열)에 맞는 고정 너비 컨테이너 안에서만 움직이도록 설정 */}
      <div className="mx-auto flex w-full flex-1 flex-col px-20">
        {/* 본문(정렬/그리드/페이지네이션) 묶음
            - 노트 카드가 2개일 때 기준 너비: 2 * 271 + 1 * 40 = 582px
            - 노트 카드가 3개일 때 기준 너비: 3 * 271 + 2 * 40 = 893px
            - 이 컨테이너 너비 안에서만 제목/정렬바/노트 개수/카드 그리드가 움직이도록 고정
            - "디자인 기준 화면 크기"보다 작아지는 순간 바로 2열로 떨어지도록,
              3열 전환 시점을 더 보수적으로(min-[1340px]) 설정 */}
        <div className="mx-auto my-auto w-[582px] min-[1340px]:w-[893px]">
          {/* 헤더 영역 */}
          <div>
            {/* 제목 */}
            <div className="mb-[16px]">
              <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
                노트 목록
              </h1>
            </div>

            {/* 정렬 버튼 + 노트 개수(같은 가로선) */}
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsSortDropdownOpen((prevIsOpen) => !prevIsOpen)
                    }
                    className="flex h-[28px] w-[140px] items-center justify-between overflow-hidden rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white px-[12px] py-[10px] transition-colors hover:bg-gray-50"
                  >
                    <span className="font-['Noto_Sans_KR',sans-serif] text-[14px] leading-[15px] font-normal whitespace-nowrap text-[#2F3440]">
                      {sortOptions.find((option) => option.value === sortOrder)
                        ?.label ?? "정렬"}
                    </span>
                    <span className="h-[16px] w-[16px] shrink-0">
                      <DropdownIcon
                        className={`h-full w-full text-[#2F3440] transition-transform ${
                          isSortDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {isSortDropdownOpen && (
                    <div className="absolute right-0 z-10 mt-[4px] w-[192px] rounded-[8px] border border-[#D1D6DE] bg-white py-[4px] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelectSort(option.value)}
                          className={`mx-[4px] flex w-[calc(100%-8px)] items-center rounded-[8px] px-[12px] py-[8px] text-left text-[13px] leading-[18px] transition-shadow ${
                            sortOrder === option.value
                              ? "border border-[#2A6AFF] font-medium text-[#003880]"
                              : "text-[#2F3440] hover:shadow-[0_0_0_3px_rgba(42,106,255,0.15)]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-[8px]">
                  <span className="text-[16px] leading-[20px] font-medium text-black">
                    노트 개수
                  </span>
                  <span className="text-[16px] leading-[20px] font-medium">
                    <span className="font-bold text-[#2A6AFF]">
                      {currentNotes}
                    </span>
                    <span className="text-black">/{totalNotes}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 노트 그리드 영역 */}
          <div>
            {/* 정렬 버튼과 노트 추가하기 카드 사이 간격 21px */}
            <div className="mt-[21px] w-full">
              {/* 노트 블록 크기(271x229)와 블록 간 간격(40px)은 고정
                  - 이 컨테이너의 너비와 정확히 맞도록 열 개수(2→3)를 변경
                  - min-[1340px] 이상에서만 3열을 사용하고,
                    그보다 작아지는 순간 바로 2열로 떨어지게 해서
                    카드가 좌우 여백(80px)까지 닿지 않도록 함 */}
              <div className="grid [grid-template-columns:repeat(2,271px)] gap-[40px] min-[1340px]:[grid-template-columns:repeat(3,271px)]">
                {/* 노트 추가하기 카드 */}
                <Link
                  to="/app/home"
                  className="group flex h-[229px] w-[271px] flex-col items-center justify-center rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] px-[97px] py-[70px] transition-colors hover:bg-[#E8ECF1]"
                >
                  <div className="mb-[8px] flex h-[60px] w-[60px] items-center justify-center rounded-[30px] bg-white p-[6px]">
                    {/* 노트 추가하기 아이콘 - HomepageInputIcons.tsx에서 가져옴 */}
                    {/* 흰 원(60px) 대비 상하좌우 6px씩 작게 => 48px */}
                    <PdfIcon
                      color="#2A6AFF"
                      size={48}
                    />
                  </div>
                  <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap text-black">
                    노트 추가하기
                  </span>
                </Link>

                {/* 노트 카드들 */}
                {sortedNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/app/chat/${note.id}`}
                    className="group flex h-[229px] w-[271px] flex-col rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] transition-colors hover:bg-[#E8ECF1]"
                  >
                    {/* 상단 회색 영역 (149px 높이) */}
                    <div className="h-[149px] w-full rounded-t-[12px] bg-[#F1F4F8]" />

                    {/* 하단 흰색 정보 영역 (80px 높이) */}
                    <div className="flex h-[80px] w-full flex-col items-start justify-center rounded-b-[12px] border-t-[0.5px] border-[#D1D6DE] bg-white px-[16px] py-[8px]">
                      <div className="flex w-[159px] flex-col gap-[8px]">
                        {/* 제목 */}
                        <h3 className="line-clamp-1 text-[14px] leading-[20px] font-medium text-black">
                          {note.title}
                        </h3>

                        {/* 메타데이터 */}
                        <div className="flex h-[32px] w-[132px] flex-col items-start justify-start pb-[4px]">
                          <div className="flex w-[134px] flex-col items-start gap-0 text-[11px] leading-[18px] font-normal text-[#6D6D6D]">
                            <p>{note.createdAt} 생성</p>
                            <p>최근 사용: {note.lastUsedAt}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 페이지네이션 - 중앙 맨 아래 노트(마지막 줄 중앙 카드) 기준 81px 아래 */}
          <div className="mt-[81px] flex items-center justify-center gap-[4px]">
            {/* 이전 페이지 버튼 */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] disabled:opacity-50"
            >
              <ArrowLeftIcon />
            </button>

            {/* 페이지 번호들 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-[8px] border transition-colors ${
                  currentPage === page
                    ? "border-[#D1D6DE] bg-[rgba(42,106,255,0.2)]"
                    : "border-[#D1D6DE] bg-white hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-[14px] leading-[22.4px] font-medium tracking-[-0.7px] ${
                    currentPage === page ? "text-[#003880]" : "text-[#6B7280]"
                  }`}
                >
                  {page}
                </span>
              </button>
            ))}

            {/* 다음 페이지 버튼 */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] disabled:opacity-50"
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
