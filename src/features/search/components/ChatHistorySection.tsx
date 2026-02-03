import { ChattingIcon } from "@/shared/components/icons/ChattingPageIcons";

interface ChatItemProps {
  title: string;
  onClick: () => void;
}

const ChatItem = ({ title, onClick }: ChatItemProps) => (
  <button
    onClick={onClick}
    className="group flex h-[60px] w-full items-center gap-4 rounded-[12px] transition-all hover:bg-white hover:shadow-[0_4px_10px_0_rgba(0,0,0,0.10)]"
  >
    <div className="pl-2">
      <ChattingIcon
        className="size-[40px] text-[#6B7280] group-hover:text-[#2A6AFF]"
        color="currentColor"
      />
    </div>
    <span className="text-[18px] font-semibold text-[#2F3440]">{title}</span>
  </button>
);

interface ChatHistorySectionProps {
  dateLabel: string;
  items: { id: string; title: string }[];
}

const ChatHistorySection = ({ dateLabel, items }: ChatHistorySectionProps) => (
  <div className="mt-4 border-none">
    <h3 className="mb-2 px-3 text-[14px] font-semibold text-[#6B7280]">
      {dateLabel}
    </h3>
    <div className="flex flex-col gap-[16px]">
      {items.map((item) => (
        <ChatItem
          key={item.id}
          title={item.title}
          onClick={() => console.log(`${item.id} 이동`)}
        />
      ))}
    </div>
  </div>
);

export { ChatHistorySection };
