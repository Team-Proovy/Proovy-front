import { useRef, useEffect } from "react";
import {
  ProfileIcon,
  SubscriptionIcon,
} from "@/shared/components/icons/SettingsIcons";
import { MessageContent } from "./MessageContent";
import { MessageAttachments } from "./MessageAttachments";
import type { ChatMessage } from "../../types/chat_types";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

// 사용자 메시지 컴포넌트
const UserMessage = ({ message }: { message: ChatMessage }) => (
  <div className="flex flex-col items-end">
    {/* 첨부파일 미리보기 (메시지 위) */}
    {message.attachments && message.attachments.length > 0 && (
      <MessageAttachments attachments={message.attachments} />
    )}
    {/* 텍스트 메시지 */}
    <div className="flex items-start justify-end gap-[12px]">
      <div className="max-w-[400px] overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white p-[10px]">
        <p className="text-[14px] leading-[20px] font-medium break-all whitespace-pre-wrap text-black">
          <MessageContent content={message.content} />
        </p>
      </div>
      <div className="shrink-0">
        <ProfileIcon
          size={40}
          color="#2A6AFF"
        />
      </div>
    </div>
  </div>
);

// AI 메시지 컴포넌트
const AssistantMessage = ({ content }: { content: string }) => (
  <div className="flex items-start justify-start gap-[12px]">
    <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[40px] border-[0.5px] border-[#D1D6DE] bg-white">
      <SubscriptionIcon
        size={40}
        isActive={true}
      />
    </div>
    <div className="w-full overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white p-[10px]">
      <p className="text-sm leading-5 break-all whitespace-pre-wrap text-gray-900">
        <MessageContent content={content} />
      </p>
    </div>
  </div>
);

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지 추가 시 하단으로 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        대화를 시작해보세요
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 justify-center overflow-x-hidden overflow-y-auto"
    >
      {/* 가운데 정렬 컨테이너 - ChatInput과 동일한 max-width */}
      <div className="w-full max-w-[660px] min-w-[270px] px-[16px] pt-[40px]">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          // 이전 메시지가 AI이고 현재가 사용자면 묶음 간 간격 (20px), 아니면 기본 간격 (12px)
          const isNewGroup =
            prevMessage?.role === "assistant" && message.role === "user";
          const marginTop =
            index === 0 ? "" : isNewGroup ? "mt-[28px]" : "mt-[12px]";

          return (
            <div
              key={message.id}
              className={`${marginTop} animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-300`}
              style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
            >
              {message.role === "user" ? (
                <UserMessage message={message} />
              ) : (
                <AssistantMessage content={message.content} />
              )}
            </div>
          );
        })}
        {/* 스크롤 여유 공간 + 자동 스크롤 앵커 */}
        <div
          ref={bottomRef}
          className="h-[40px] shrink-0"
        />
      </div>
    </div>
  );
};
