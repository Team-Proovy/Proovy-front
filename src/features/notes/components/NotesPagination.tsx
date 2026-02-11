/**
 * NotesPagination - 페이지네이션 컴포넌트
 */

import type { PageInfo } from "../../../shared/api/shared_types";

interface NotesPaginationProps {
  pageInfo: PageInfo | undefined;
  currentPage: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

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

const getPaginationItems = (
  totalPages: number,
  currentPage: number,
  windowSize: number,
): (number | "ellipsis")[] => {
  if (totalPages <= 0) {
    return [];
  }

  const items: (number | "ellipsis")[] = [];
  let previousPage: number | null = null;

  for (let page = 0; page < totalPages; page += 1) {
    const isFirst = page === 0;
    const isLast = page === totalPages - 1;
    const isInWindow =
      page >= currentPage - windowSize && page <= currentPage + windowSize;

    if (!isFirst && !isLast && !isInWindow) {
      continue;
    }

    if (previousPage !== null && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
    previousPage = page;
  }

  return items;
};

export const NotesPagination = ({
  pageInfo,
  currentPage,
  onPreviousPage,
  onNextPage,
  onPageChange,
}: NotesPaginationProps) => {
  if (!pageInfo || pageInfo.totalPages <= 1) {
    return null;
  }

  const paginationItems = getPaginationItems(
    pageInfo.totalPages,
    currentPage,
    2,
  );

  return (
    <div className="mt-[81px] flex items-center justify-center gap-[4px]">
      {/* 이전 페이지 버튼 */}
      <button
        onClick={onPreviousPage}
        disabled={!pageInfo.hasPrevious}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] disabled:opacity-50"
      >
        <ArrowLeftIcon />
      </button>

      {/* 페이지 번호들 */}
      {paginationItems.map((item, index) => {
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
            onClick={() => onPageChange(page)}
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
              {page + 1}
            </span>
          </button>
        );
      })}

      {/* 다음 페이지 버튼 */}
      <button
        onClick={onNextPage}
        disabled={!pageInfo.hasNext}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] disabled:opacity-50"
      >
        <ArrowRightIcon />
      </button>
    </div>
  );
};
