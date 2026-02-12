/**
 * NotesHeader - 노트 목록 페이지 헤더영역
 * - 제목, 정렬 버튼, 선택 버튼, 노트 개수
 */

import { useEffect, useRef } from "react";
import { DropdownIcon } from "../../../shared/components/icons/ChatInputIcons";
import { SORT_OPTIONS } from "../constants/sort_options";
import type { SortOrder } from "../constants/sort_options";

interface NotesHeaderProps {
  sortOrder: SortOrder;
  isSortDropdownOpen: boolean;
  isSelectMode: boolean;
  totalElements: number;
  maxNotes?: number;
  onSelectSort: (value: SortOrder) => void;
  onToggleSortDropdown: (open: boolean) => void;
  onEnterSelectMode: () => void;
  onCancelSelectMode: () => void;
  onDeleteClick: () => void;
  selectedCount?: number;
}

export const NotesHeader = ({
  sortOrder,
  isSortDropdownOpen,
  isSelectMode,
  totalElements,
  maxNotes,
  onSelectSort,
  onToggleSortDropdown,
  onEnterSelectMode,
  onCancelSelectMode,
  onDeleteClick,
  selectedCount = 0,
}: NotesHeaderProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSortDropdownOpen &&
        dropdownRef.current &&
        toggleRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !toggleRef.current.contains(event.target as Node)
      ) {
        onToggleSortDropdown(false);
      }
    };

    if (isSortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSortDropdownOpen, onToggleSortDropdown]);
  return (
    <div className="w-full">
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
            <div
              className="relative"
              ref={dropdownRef}
            >
              <button
                ref={toggleRef}
                type="button"
                onClick={() => onToggleSortDropdown(!isSortDropdownOpen)}
                className="flex h-[28px] w-[140px] cursor-pointer items-center justify-between overflow-hidden rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white px-[12px] py-[10px] transition-colors hover:bg-gray-50"
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
                      className={`mx-[4px] flex w-[calc(100%-8px)] cursor-pointer items-center rounded-[8px] px-[12px] py-[8px] text-left text-[13px] leading-[18px] transition-shadow ${
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

            {/* 선택/취소 + 삭제 버튼 */}
            {isSelectMode ? (
              <div className="flex items-center gap-[8px]">
                <button
                  onClick={onCancelSelectMode}
                  className="flex h-[32px] w-[80px] cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] font-medium text-[#9CA4B0] transition-colors duration-200 hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white"
                  type="button"
                >
                  취소
                </button>
                <button
                  onClick={onDeleteClick}
                  disabled={selectedCount === 0}
                  className="flex h-[32px] w-[80px] cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] font-medium text-[#2A6AFF] transition-colors duration-200 hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                >
                  삭제하기
                </button>
              </div>
            ) : (
              <button
                onClick={onEnterSelectMode}
                className="flex h-[32px] w-[80px] cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] font-medium text-[#9CA4B0] transition-colors duration-200 hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white"
                type="button"
              >
                선택
              </button>
            )}
          </div>

          {/* 노트 개수 */}
          <div className="flex items-center gap-[8px]">
            <span className="text-[16px] leading-[20px] font-medium text-black">
              노트 개수
            </span>
            <span className="text-[16px] leading-[20px] font-medium">
              <span className="font-bold text-[#2A6AFF]">{totalElements}</span>
              <span className="text-black">/{maxNotes ?? totalElements}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
