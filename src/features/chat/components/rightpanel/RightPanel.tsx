import { ChatInput } from "@/features/editor/components/ChatInput";
import type { ChatSendData } from "@/features/editor/components/ChatInput";
import { ChatMessages } from "./ChatMessages";
import type { ChatMessage } from "../../types/chat_types";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

interface RightPanelProps {
  messages: ChatMessage[];
  noteId?: number | null;
  onSend?: (data: ChatSendData) => void | boolean | Promise<void | boolean>;
  isSending?: boolean;
  /** 대화 히스토리 로딩 중 여부 */
  isLoading?: boolean;
}

export const RightPanel = ({
  messages,
  noteId,
  onSend,
  isSending,
  isLoading = false,
}: RightPanelProps) => {
  return (
    <div className="flex h-full flex-col bg-[#F1F4F8]">
      {/* 메시지 영역 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size={50} />
              <span className="text-sm">대화를 불러오는 중...</span>
            </div>
          </div>
        ) : (
          <ChatMessages messages={messages} />
        )}
      </div>

      {/* 입력 영역 */}
      <div className="flex shrink-0 justify-center px-[16px] pb-[20px]">
        <ChatInput
          noteId={noteId}
          onSend={onSend}
          isSending={isSending}
        />
      </div>
    </div>
  );
};
