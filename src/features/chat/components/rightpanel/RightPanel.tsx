import { ChatInput } from "@/features/editor/components/ChatInput";
import { RightPanelHeader } from "./RightPanelHeader";
import { ChatMessages } from "./ChatMessages";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RightPanelProps {
  title: string;
  messages: Message[];
  isViewerOpen: boolean;
  onToggleViewer: () => void;
}

export const RightPanel = ({
  title,
  messages,
  isViewerOpen,
  onToggleViewer,
}: RightPanelProps) => {
  return (
    <div className="flex h-full flex-col bg-[#F1F4F8]">
      {/* 헤더 - 가운데 정렬 */}
      <div className="flex shrink-0 justify-center px-[20px]">
        <RightPanelHeader
          title={title}
          isViewerOpen={isViewerOpen}
          onToggleViewer={onToggleViewer}
        />
      </div>

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
