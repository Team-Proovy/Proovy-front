import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  ChattingIcon,
  NewChattingIcon,
} from "@/shared/components/icons/ChattingPageIcons";
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // ESC 키 누르면 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  // 배경 클릭 시 닫기 핸들러
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative flex h-[495px] w-[836px] flex-col overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]">
        {/* 상단 검색 영역 */}
        {/* 상단 검색 영역 */}
        <div className="flex w-full items-center bg-transparent pt-6 pr-[36px] pb-4 pl-9">
          <input
            autoFocus
            type="text"
            placeholder="채팅 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="font-regular flex-1 bg-transparent text-[20px] placeholder-[#000000] outline-none placeholder:text-[20px]"
          />
          <button
            onClick={onClose}
            className="ml-4 rounded-full p-1 transition-colors"
          >
            <X className="size-[24px] text-[#000000] hover:text-[#2A6AFF]" />
          </button>
        </div>

        {/* 구분선 추가 */}
        <div className="mx-6 h-px bg-gray-200"></div>

        {/* 검색 결과 영역 */}
        <div className="custom-scrollbar flex-1 gap-[12px] overflow-y-auto p-4 pr-4">
          {/* 새 채팅 버튼 */}
          <div className="h-[60px] w-full">
            <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
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
          </div>

          {/* 섹션: 오늘 */}
          <div className="mt-4">
            <h3 className="mb-2 px-3 text-[14px] font-semibold text-[#6B7280]">
              오늘
            </h3>
            <div className="flex flex-col gap-[16px]">
              {/* 임시 검색 결과 아이템 */}
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
            </div>
          </div>
          {/* 섹션: 오늘 (Duplicate 1) */}
          <div className="mt-4">
            <h3 className="mb-2 px-3 pl-3 text-[14px] font-semibold text-[#6B7280]">
              오늘
            </h3>
            <div className="flex flex-col gap-[16px]">
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
            </div>
          </div>

          {/* 섹션: 오늘 (Duplicate 2) */}
          <div className="mt-4">
            <h3 className="mb-2 px-3 pl-3 text-[14px] font-semibold text-[#6B7280]">
              오늘
            </h3>
            <div className="flex flex-col gap-[16px]">
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
            </div>
          </div>

          {/* 섹션: 오늘 (Duplicate 3) */}
          <div className="mt-4">
            <h3 className="mb-2 px-3 pl-3 text-[14px] font-semibold text-[#6B7280]">
              오늘
            </h3>
            <div className="flex flex-col gap-[16px]">
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
            </div>
          </div>

          {/* 섹션: 어제 */}
          <div className="mt-4">
            <h3 className="mb-2 px-3 pl-3 text-[14px] font-semibold text-[#6B7280]">
              어제
            </h3>
            <div className="flex flex-col gap-[16px]">
              <button className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
                <div className="pl-2">
                  <ChattingIcon
                    className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
                    color="currentColor"
                  />
                </div>
                <span className="text-[18px] font-semibold text-[#2F3440]">
                  분석해줘
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
