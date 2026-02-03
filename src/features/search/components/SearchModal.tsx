import { useEffect, useState } from "react";
import SearchInput from "./SearchInput";
import { ChatHistorySection } from "./ChatHistorySection";
import { NewChattingIcon } from "@/shared/components/icons/ChattingPageIcons";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Dummy Data -> API 연동 전 임시 데이터 구조 (나중에 이 부분만 API 결과로 교체)
  const dummyData = [
    {
      date: "오늘",
      chats: [
        { id: "1", title: "분석해줘" },
        { id: "2", title: "분석해줘" },
      ],
    },
    { date: "어제", chats: [{ id: "3", title: "분석해줘" }] },
    { date: "그저께", chats: [{ id: "4", title: "분석해줘" }] },
    {
      date: "2026-01-01",
      chats: [
        { id: "5", title: "분석해줘" },
        { id: "6", title: "분석해줘" },
      ],
    },
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex h-[495px] w-[836px] flex-col overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={onClose}
        />
        <div className="mx-6 h-px bg-gray-200"></div>

        <div className="custom-scrollbar flex flex-1 flex-col gap-[12px] overflow-y-auto p-4 pr-4">
          {/* 새 채팅 버튼 */}
          <button className="group flex h-[60px] min-h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]">
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

          {/* 날짜별 섹션 렌더링 */}
          {dummyData.map((section) => (
            <ChatHistorySection
              key={section.date}
              dateLabel={section.date}
              items={section.chats}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
