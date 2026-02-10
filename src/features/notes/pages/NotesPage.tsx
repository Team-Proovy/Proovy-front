/**
 * NotesPage - 노트 목록 페이지
 *
 * URL: /app/notes
 *
 * 기능:
 * - 전체 노트 목록 표시 (페이지네이션)
 * - 노트 카드 클릭 → /app/chat/:noteId 로 이동
 * - "노트 추가하기" 클릭 → /app/home 으로 이동
 */

import { Link } from "react-router-dom";
import { useState } from "react";
import { useNoteList } from "../hooks/useNotes";

// 아이콘
import { PdfIcon } from "../../../shared/components/icons/HomepageInputIcons";
import { DropdownIcon } from "../../../shared/components/icons/ChatInputIcons";

// 컴포넌트
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { DeleteNotesModal } from "../components/DeleteNotesModal";
import { DeletionSuccessModal } from "../components/DeletionSuccessModal";

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

type SortOrder = "lastUsedAt,desc" | "createdAt,desc" | "title,asc";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "lastUsedAt,desc", label: "최근 사용 순" },
  { value: "createdAt,desc", label: "최신 생성 순" },
  { value: "title,asc", label: "이름 순" },
];

export const NotesPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUsedAt,desc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // API 데이터 조회
  const { data, isLoading, isError } = useNoteList({
    page: currentPage,
    size: 20,
    sort: sortOrder,
  });

  const notes = data?.notes || [];
  const pageInfo = data?.pageInfo;

  const handleSelectSort = (value: SortOrder) => {
    setSortOrder(value);
    setCurrentPage(0); // 정렬 변경 시 첫 페이지로 리셋
    setIsSortDropdownOpen(false);
  };

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleIdSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleActionClick = () => {
    if (isSelectMode) {
      if (selectedIds.length > 0) {
        setIsDeleteModalOpen(true);
      }
    } else {
      toggleSelectMode();
    }
  };

  const handlePreviousPage = () => {
    if (pageInfo?.hasPrevious) {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (pageInfo?.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-[16px] leading-[20px] font-medium text-black">
            노트 목록을 불러올 수 없습니다.
          </p>
          <p className="mt-[8px] text-[14px] leading-[18px] text-[#6D6D6D]">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-white">
      <div className="mx-auto flex w-full flex-1 flex-col px-20">
        <div className="mx-auto my-auto w-[582px] min-[1340px]:w-[893px]">
          {/* 헤더 영역 */}
          <div>
            {/* 제목 */}
            <div className="mb-[16px]">
              <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
                노트 목록
              </h1>
            </div>

            {/* 정렬 버튼 + 선택 버튼 + 노트 개수(같은 가로선) */}
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[8px]">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsSortDropdownOpen((prevIsOpen) => !prevIsOpen)
                      }
                      className="flex h-[28px] w-[140px] items-center justify-between overflow-hidden rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white px-[12px] py-[10px] transition-colors hover:bg-gray-50"
                    >
                      <span className="font-['Noto_Sans_KR',sans-serif] text-[14px] leading-[15px] font-normal whitespace-nowrap text-[#2F3440]">
                        {SORT_OPTIONS.find(
                          (option) => option.value === sortOrder,
                        )?.label ?? "정렬"}
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
                        {SORT_OPTIONS.map((option) => (
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

                  {/* 선택 버튼 */}
                  <button
                    onClick={handleActionClick}
                    className={`flex items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] font-medium transition-all hover:border-[#2A6AFF] hover:bg-[#2A6AFF] hover:text-white ${
                      isSelectMode
                        ? "border-[#2A6AFF] text-[#2A6AFF]"
                        : "text-[#9CA4B0]"
                    }`}
                    style={{
                      width: "80px",
                      height: "32px",
                    }}
                  >
                    {isSelectMode ? "삭제하기" : "선택"}
                  </button>
                </div>

                <div className="flex items-center gap-[8px]">
                  <span className="text-[16px] leading-[20px] font-medium text-black">
                    노트 개수
                  </span>
                  <span className="text-[16px] leading-[20px] font-medium">
                    <span className="font-bold text-[#2A6AFF]">
                      {notes.length}
                    </span>
                    <span className="text-black">
                      /{pageInfo?.totalElements || 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 노트 그리드 영역 */}
          <div>
            <div className="mt-[21px] w-full">
              <div className="grid [grid-template-columns:repeat(2,271px)] gap-[40px] min-[1340px]:[grid-template-columns:repeat(3,271px)]">
                {/* 노트 추가하기 카드 */}
                <Link
                  to="/app/home"
                  className="group flex h-[229px] w-[271px] flex-col items-center justify-center rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] px-[97px] py-[70px] transition-colors hover:bg-[#E8ECF1]"
                >
                  <div className="mb-[8px] flex h-[60px] w-[60px] items-center justify-center rounded-[30px] bg-white p-[6px]">
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
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center py-[40px]">
                    <LoadingSpinner size={80} />
                  </div>
                ) : notes.length > 0 ? (
                  notes.map((note) => {
                    const isSelected = selectedIds.includes(note.noteId);
                    return isSelectMode ? (
                      <button
                        key={note.noteId}
                        onClick={() => toggleIdSelection(note.noteId)}
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
                          {isSelected && (
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
                          )}
                        </div>

                        {/* 상단 썸네일 영역 (149px 높이) */}
                        <div className="h-[149px] w-full overflow-hidden rounded-t-[12px] bg-[#E8ECF1]">
                          {note.thumbnailUrl ? (
                            <img
                              src={note.thumbnailUrl}
                              alt={note.title}
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

                        {/* 하단 흰색 정보 영역 (80px 높이) */}
                        <div className="flex h-[80px] w-full flex-col items-start justify-center rounded-b-[12px] border-t-[0.5px] border-[#D1D6DE] bg-white px-[16px] py-[8px]">
                          <div className="flex w-full flex-col gap-[8px]">
                            {/* 제목 */}
                            <h3 className="line-clamp-1 text-[14px] leading-[20px] font-medium text-black">
                              {note.title}
                            </h3>

                            {/* 메타데이터 */}
                            <div className="flex flex-col items-start gap-0 text-[11px] leading-[18px] font-normal text-[#6D6D6D]">
                              <p>
                                생성:{" "}
                                {new Date(note.createdAt).toLocaleDateString(
                                  "ko-KR",
                                )}
                              </p>
                              <p>
                                최근 사용:{" "}
                                {new Date(note.lastUsedAt).toLocaleDateString(
                                  "ko-KR",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <Link
                        key={note.noteId}
                        to={`/app/chat/${note.noteId}`}
                        className="group flex h-[229px] w-[271px] flex-col rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] transition-colors hover:bg-[#E8ECF1]"
                      >
                        {/* 상단 썸네일 영역 (149px 높이) */}
                        <div className="h-[149px] w-full overflow-hidden rounded-t-[12px] bg-[#E8ECF1]">
                          {note.thumbnailUrl ? (
                            <img
                              src={note.thumbnailUrl}
                              alt={note.title}
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

                        {/* 하단 흰색 정보 영역 (80px 높이) */}
                        <div className="flex h-[80px] w-full flex-col items-start justify-center rounded-b-[12px] border-t-[0.5px] border-[#D1D6DE] bg-white px-[16px] py-[8px]">
                          <div className="flex w-full flex-col gap-[8px]">
                            {/* 제목 */}
                            <h3 className="line-clamp-1 text-[14px] leading-[20px] font-medium text-black">
                              {note.title}
                            </h3>

                            {/* 메타데이터 */}
                            <div className="flex flex-col items-start gap-0 text-[11px] leading-[18px] font-normal text-[#6D6D6D]">
                              <p>
                                생성:{" "}
                                {new Date(note.createdAt).toLocaleDateString(
                                  "ko-KR",
                                )}
                              </p>
                              <p>
                                최근 사용:{" "}
                                {new Date(note.lastUsedAt).toLocaleDateString(
                                  "ko-KR",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-full flex items-center justify-center py-[40px]">
                    <span className="text-[14px] leading-[20px] text-[#6D6D6D]">
                      노트가 없습니다.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 페이지네이션 */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="mt-[81px] flex items-center justify-center gap-[4px]">
              {/* 이전 페이지 버튼 */}
              <button
                onClick={handlePreviousPage}
                disabled={!pageInfo.hasPrevious}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] disabled:opacity-50"
              >
                <ArrowLeftIcon />
              </button>

              {/* 페이지 번호들 */}
              {(() => {
                const totalPages = pageInfo.totalPages;
                const current = currentPage;
                const windowSize = 2; // 현재 페이지 기준 노출 범위 (±2)

                type PaginationItem = number | "ellipsis";
                const paginationItems: PaginationItem[] = [];

                if (totalPages <= 0) {
                  return null;
                }

                let previousPage: number | null = null;

                for (let page = 0; page < totalPages; page += 1) {
                  const isFirst = page === 0;
                  const isLast = page === totalPages - 1;
                  const isInWindow =
                    page >= current - windowSize &&
                    page <= current + windowSize;

                  if (!isFirst && !isLast && !isInWindow) {
                    continue;
                  }

                  if (previousPage !== null && page - previousPage > 1) {
                    paginationItems.push("ellipsis");
                  }

                  paginationItems.push(page);
                  previousPage = page;
                }

                return paginationItems.map((item, index) => {
                  if (item === "ellipsis") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="flex h-[30px] w-[30px] items-center justify-center text-[14px] leading-[22.4px] font-medium tracking-[-0.7px] text-[#6B7280]"
                      >
                        ...
                      </span>
                    );
                  }

                  const page = item;
                  return (
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
                          currentPage === page
                            ? "text-[#003880]"
                            : "text-[#6B7280]"
                        }`}
                      >
                        {page + 1}
                      </span>
                    </button>
                  );
                });
              })()}

              {/* 다음 페이지 버튼 */}
              <button
                onClick={handleNextPage}
                disabled={!pageInfo.hasNext}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] disabled:opacity-50"
              >
                <ArrowRightIcon />
              </button>
            </div>
          )}
        </div>
      </div>
      {isDeleteModalOpen && (
        <DeleteNotesModal
          selectedIds={selectedIds}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
            setIsSuccessModalOpen(true);
            setIsSelectMode(false);
            setSelectedIds([]);
          }}
        />
      )}
      {isSuccessModalOpen && (
        <DeletionSuccessModal onClose={() => setIsSuccessModalOpen(false)} />
      )}
    </div>
  );
};
