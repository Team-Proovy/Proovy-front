import { useEffect, useLayoutEffect, useRef } from "react";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import {
  HISTORY_EMPTY_TEXT,
  HISTORY_LOADING_TEXT,
  LOAD_OLDER_BUTTON,
} from "../../run/conversation_notice";
import type { ConversationTurn } from "../../run/conversation_turns";
import type { HistoryState } from "../../run/useNoteConversation";
import { ConversationTurnView } from "./ConversationTurnView";

/** 아래 끝에서 이 거리(px) 안이면 새 내용이 생길 때 아래로 따라간다. */
const STICK_TO_BOTTOM_PX = 80;

interface ConversationMessagesProps {
  turns: readonly ConversationTurn[];
  history: HistoryState;
  onLoadOlder: () => void;
  onRefill: (text: string) => void;
}

/**
 * 대화 목록 — 이력(대화 조회)과 이 화면의 run을 같은 목록에 그린다.
 * 아래 끝을 보고 있으면 진행·완료로 내용이 늘어날 때 따라 내려가고, 위를 읽는 중이면 그대로 둔다.
 */
export const ConversationMessages = ({
  turns,
  history,
  onLoadOlder,
  onRefill,
}: ConversationMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastTurnKeyRef = useRef<string | null>(null);
  const firstTurnKeyRef = useRef<string | null>(null);
  const scrollHeightRef = useRef(0);
  /** 마지막으로 코드가 맞춘 scrollTop. 이보다 위로 가면 사용자가 올려 읽는 중이다. */
  const pinnedTopRef = useRef(0);

  const pinToBottom = (container: HTMLDivElement) => {
    container.scrollTop = container.scrollHeight;
    pinnedTopRef.current = container.scrollTop;
  };

  const firstTurnKey = turns[0]?.key ?? null;
  const lastTurnKey = turns.at(-1)?.key ?? null;
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // 새 질문이 붙으면 위를 읽던 중이어도 그 질문으로 내려간다.
    if (lastTurnKey !== lastTurnKeyRef.current) stickRef.current = true;
    if (stickRef.current) pinToBottom(container);
    // 이전 대화를 앞에 붙이면 보던 위치를 지킨다.
    else if (firstTurnKey !== firstTurnKeyRef.current)
      container.scrollTop += container.scrollHeight - scrollHeightRef.current;
    lastTurnKeyRef.current = lastTurnKey;
    firstTurnKeyRef.current = firstTurnKey;
    scrollHeightRef.current = container.scrollHeight;
  });

  // 입력창 높이(안내 줄·draft)나 응답 접기/펼치기로 크기가 바뀌어도 아래 끝을 보고 있었으면 따라간다.
  const isListShown = turns.length > 0;
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stickRef.current) pinToBottom(container);
      scrollHeightRef.current = container.scrollHeight;
    });
    observer.observe(container);
    if (container.firstElementChild)
      observer.observe(container.firstElementChild);
    return () => observer.disconnect();
  }, [isListShown]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    // 아래 끝 근처면 따라가고, 사용자가 위로 올렸을 때만 멈춘다(내용이 늘며 생긴 거리로는 멈추지 않는다).
    if (distance <= STICK_TO_BOTTOM_PX) stickRef.current = true;
    else if (container.scrollTop < pinnedTopRef.current - 1)
      stickRef.current = false;
  };

  if (history.status === "loading" && turns.length === 0)
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size={50} />
          <span className="text-sm">{HISTORY_LOADING_TEXT}</span>
        </div>
      </div>
    );

  if (history.status !== "loading" && turns.length === 0)
    return (
      <div className="flex h-full flex-1 items-center justify-center text-gray-400">
        {history.status === "ready" ? HISTORY_EMPTY_TEXT : null}
      </div>
    );

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative flex h-full justify-center overflow-x-hidden overflow-y-auto"
    >
      {/* 가운데 정렬 컨테이너 - ChatInput과 동일한 max-width */}
      <div className="flex w-full max-w-[660px] min-w-[270px] flex-col gap-[40px] self-start px-[16px] pt-[40px] pb-[32px]">
        {history.status === "ready" && history.nextBefore !== null && (
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={history.loadingOlder}
            className="self-center rounded-[20px] border-[0.5px] border-[#D1D6DE] bg-white px-[14px] py-[6px] text-[13px] font-medium text-[#374151] disabled:opacity-60"
          >
            {history.loadingOlder ? HISTORY_LOADING_TEXT : LOAD_OLDER_BUTTON}
          </button>
        )}
        {turns.map((turn) => (
          <ConversationTurnView
            key={turn.key}
            turn={turn}
            onRefill={onRefill}
          />
        ))}
      </div>
    </div>
  );
};
