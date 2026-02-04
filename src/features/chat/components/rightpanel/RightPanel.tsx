import { ChatInput } from "@/features/editor/components/ChatInput";
import { ChatMessages } from "./ChatMessages";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RightPanelProps {
  messages: Message[];
}

export const RightPanel = ({ messages }: RightPanelProps) => {
  return (
    <div className="flex h-full flex-col bg-[#F1F4F8]">
      {/* 메시지 + 입력창 컨테이너 (가운데 정렬) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 메시지 영역 */}
        <ChatMessages messages={messages} />

        {/* 입력창 - 가운데 정렬 */}
        <div className="flex shrink-0 justify-center px-[16px] pb-[20px]">
          <ChatInput />
        </div>
      </div>
    </div>
  );
};
