/**
 * NotesHeader - 노트 목록 페이지 헤더영역
 * - 제목, 정렬 버튼, 선택 버튼, 노트 개수
 */

import { DropdownIcon } from "../../../shared/components/icons/ChatInputIcons";
import { SORT_OPTIONS } from "../constants/sort_options";
import type { SortOrder } from "../constants/sort_options";

interface NotesHeaderProps {
  sortOrder: SortOrder;
  isSortDropdownOpen: boolean;
  isSelectMode: boolean;
  notesCount: number;
  totalElements: number;
  onSelectSort: (value: SortOrder) => void;
  onToggleSortDropdown: (open: boolean) => void;
  onActionClick: () => void;
}

export const NotesHeader = ({
  sortOrder,
  isSortDropdownOpen,
  isSelectMode,
  notesCount,
  totalElements,
  onSelectSort,
  onToggleSortDropdown,
  onActionClick,
}: NotesHeaderProps) => {
  return (
    <div>
      {/* 제목 */}
      <div className="mb-[16px]">
        <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
          노트 목록
        </h1>
      </div>

      {/* 정렬 버튼 + 선택 버튼 + 노트 개수 */}
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            {/* 정렬 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => onToggleSortDropdown(!isSortDropdownOpen)}
                className="flex h-[28px] w-[140px] items-center justify-between overflow-hidden rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white px-[12px] py-[10px] transition-colors hover:bg-gray-50"
              >
                <span className="font-['Noto_Sans_KR',sans-serif] text-[14px] leading-[15px] font-normal whitespace-nowrap text-[#2F3440]">
                  {SORT_OPTIONS.find((option) => option.value === sortOrder)
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
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onSelectSort(option.value)}
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
              onClick={onActionClick}
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

          {/* 노트 개수 */}
          <div className="flex items-center gap-[8px]">
            <span className="text-[16px] leading-[20px] font-medium text-black">
              노트 개수
            </span>
            <span className="text-[16px] leading-[20px] font-medium">
              <span className="font-bold text-[#2A6AFF]">{notesCount}</span>
              <span className="text-black">/{totalElements}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
