import { ChattingIcon } from "@/shared/components/icons/ChattingPageIcons";

interface ChatItemProps {
  title: string;
  preview?: string;
  searchQuery?: string;
  onClick: () => void;
}

/** 검색어 하이라이트 (대소문자 무시) */
const HighlightText = ({ text, query }: { text: string; query?: string }) => {
  if (!query || query.length < 2) return <>{text}</>;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="rounded-sm bg-[#2A6AFF]/15 px-0.5 text-[#2A6AFF]"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

const ChatItem = ({ title, preview, searchQuery, onClick }: ChatItemProps) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center gap-4 rounded-[12px] px-2 py-3 transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]"
  >
    <div className="shrink-0">
      <ChattingIcon
        className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
        color="currentColor"
      />
    </div>
    <div className="min-w-0 flex-1 text-left">
      <span className="block truncate text-[16px] font-semibold text-[#2F3440]">
        <HighlightText
          text={title}
          query={searchQuery}
        />
      </span>
      {preview && (
        <span className="mt-0.5 block truncate text-[13px] text-[#9CA4B0]">
          <HighlightText
            text={preview}
            query={searchQuery}
          />
        </span>
      )}
    </div>
  </button>
);

interface ChatHistorySectionProps {
  dateLabel: string;
  items: { id: string; title: string; noteId?: number; preview?: string }[];
  onItemClick?: (noteId: number) => void;
  searchQuery?: string;
}

const ChatHistorySection = ({
  dateLabel,
  items,
  onItemClick,
  searchQuery,
}: ChatHistorySectionProps) => (
  <div className="mt-4 border-none">
    <h3 className="mb-2 px-3 text-[14px] font-semibold text-[#6B7280]">
      {dateLabel}
    </h3>
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <ChatItem
          key={item.id}
          title={item.title}
          preview={item.preview}
          searchQuery={searchQuery}
          onClick={() => {
            if (onItemClick && item.noteId) {
              onItemClick(item.noteId);
            } else {
              console.log(`${item.id} 이동`);
            }
          }}
        />
      ))}
    </div>
  </div>
);

export { ChatHistorySection };
