import { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  ProfileIcon,
  SubscriptionIcon,
} from "@/shared/components/icons/SettingsIcons";
import { MessageContent } from "./MessageContent";
import { MessageAttachments } from "./MessageAttachments";
import { ThinkingBar } from "./ThinkingBar";
import type { ChatMessage } from "../../types/chat_types";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

// ── 조정 가능한 상수 ──
// USER_MESSAGE_TOP_GAP: 사용자 메시지가 스크롤 컨테이너 상단에서 떨어지는 간격(px)
// MIN_BOTTOM_SPACER: 콘텐츠와 입력창 사이의 최소 여백(px)
const USER_MESSAGE_TOP_GAP = 32;
const MIN_BOTTOM_SPACER = 32;

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
        <div className="text-[14px] leading-[20px] font-medium break-words whitespace-pre-wrap text-black">
          <MessageContent
            content={message.content}
            enableFileMentionChip={true}
          />
        </div>
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
const AssistantMessage = ({
  content,
  isStreaming,
  statusText,
}: {
  content: string;
  isStreaming?: boolean;
  statusText?: string;
}) => (
  <div className="flex items-start justify-start gap-[12px]">
    <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[40px] border-[0.5px] border-[#D1D6DE] bg-white">
      <SubscriptionIcon
        size={40}
        isActive={true}
      />
    </div>
    {isStreaming && !content ? (
      <ThinkingBar statusText={statusText} />
    ) : (
      <div className="w-full overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white p-[10px]">
        <div className="text-sm leading-5 break-words text-gray-900">
          <MessageContent content={content} />
        </div>
      </div>
    )}
  </div>
);

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const lastAnchoredUserMessageIdRef = useRef<string | null>(null);
  const hasMountedRef = useRef(false);
  const spacerHeightRef = useRef(0);

  /** spacer 높이를 DOM에 직접 반영 (React 리렌더 없이) */
  const setSpacerHeight = useCallback((h: number) => {
    spacerHeightRef.current = h;
    if (spacerRef.current) spacerRef.current.style.height = `${h}px`;
  }, []);

  useLayoutEffect(() => {
    if (!scrollRef.current) return;

    let lastUserMessage: ChatMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessage = messages[i];
        break;
      }
    }

    if (!lastUserMessage || !lastUserMsgRef.current) return;

    const hasStreamingAssistant = messages.some(
      (m) => m.role === "assistant" && !!m.isStreaming,
    );

    // 첫 마운트에서 기존 히스토리만 있는 경우에는 자동 점프를 막고,
    // 첫 전송(assistant isStreaming) 시에는 아래 신규 사용자 메시지 분기로 진행
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setSpacerHeight(MIN_BOTTOM_SPACER);
      if (!hasStreamingAssistant) {
        lastAnchoredUserMessageIdRef.current = lastUserMessage.id;
        return;
      }
    }

    const container = scrollRef.current;
    const isNewUserMessage =
      lastAnchoredUserMessageIdRef.current !== lastUserMessage.id;

    // 사용자 메시지를 상단 32px 위치에 놓기 위해 필요한 scrollTop
    const targetScrollTop = Math.max(
      lastUserMsgRef.current.offsetTop - USER_MESSAGE_TOP_GAP,
      0,
    );
    // 현재 spacer를 제외한 순수 콘텐츠 높이
    const contentHeight = container.scrollHeight - spacerHeightRef.current;

    if (isNewUserMessage) {
      // ── 새 사용자 메시지: 상단 앵커 ──
      // 올바른 공식: targetScrollTop까지 스크롤하려면
      // scrollHeight - clientHeight >= targetScrollTop 이어야 하므로
      // spacer >= targetScrollTop + clientHeight - contentHeight
      lastAnchoredUserMessageIdRef.current = lastUserMessage.id;
      const neededSpacer = Math.max(
        targetScrollTop + container.clientHeight - contentHeight,
        MIN_BOTTOM_SPACER,
      );

      setSpacerHeight(neededSpacer);

      // DOM 직접 변경 → reflow → scrollHeight 즉시 반영
      const maxScrollTop = Math.max(
        container.scrollHeight - container.clientHeight,
        0,
      );
      container.scrollTo({
        top: Math.min(targetScrollTop, maxScrollTop),
        behavior: "smooth",
      });
    } else if (hasStreamingAssistant) {
      // ── AI 스트리밍 중: spacer 자동 축소 ──
      // 콘텐츠가 늘어남에 따라 spacer를 줄여 과도한 여백 제거
      const optimalSpacer = Math.max(
        targetScrollTop + container.clientHeight - contentHeight,
        MIN_BOTTOM_SPACER,
      );

      setSpacerHeight(optimalSpacer);
    }
  }, [messages, setSpacerHeight]);

  // 대화 초기화 시: mount/anchor/spacer 상태를 모두 리셋
  useEffect(() => {
    if (messages.length !== 0) return;

    hasMountedRef.current = false;
    lastAnchoredUserMessageIdRef.current = null;
    spacerHeightRef.current = MIN_BOTTOM_SPACER;
    setSpacerHeight(MIN_BOTTOM_SPACER);
  }, [messages.length, setSpacerHeight]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        대화를 시작해보세요
      </div>
    );
  }

  // 마지막 사용자 메시지 인덱스 → ref 부착 대상
  let lastUserMsgIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserMsgIndex = i;
      break;
    }
  }

  return (
    <div
      ref={scrollRef}
      className="relative flex h-full justify-center overflow-x-hidden overflow-y-auto"
    >
      {/* 가운데 정렬 컨테이너 - ChatInput과 동일한 max-width */}
      <div className="w-full max-w-[660px] min-w-[270px] px-[16px] pt-[40px]">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const isNewGroup =
            prevMessage?.role === "assistant" && message.role === "user";
          const marginTop =
            index === 0 ? "" : isNewGroup ? "mt-[40px]" : "mt-[12px]";

          return (
            <div
              key={message.id}
              ref={index === lastUserMsgIndex ? lastUserMsgRef : undefined}
              className={`${marginTop} animate-in fade-in slide-in-from-bottom-3 fill-mode-both scroll-mt-[28px] duration-300`}
              style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
            >
              {message.role === "user" ? (
                <UserMessage message={message} />
              ) : (
                <AssistantMessage
                  content={message.content}
                  isStreaming={message.isStreaming}
                  statusText={message.statusText}
                />
              )}
            </div>
          );
        })}
        <div
          ref={spacerRef}
          className="shrink-0"
        />
      </div>
    </div>
  );
};
