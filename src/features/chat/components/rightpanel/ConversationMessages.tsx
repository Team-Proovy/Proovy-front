import { useLayoutEffect, useRef } from "react";
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

  const firstTurnKey = turns[0]?.key ?? null;
  const lastTurnKey = turns.at(-1)?.key ?? null;
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // 새 질문이 붙으면 위를 읽던 중이어도 그 질문으로 내려간다.
    if (lastTurnKey !== lastTurnKeyRef.current) stickRef.current = true;
    if (stickRef.current) container.scrollTop = container.scrollHeight;
    // 이전 대화를 앞에 붙이면 보던 위치를 지킨다.
    else if (firstTurnKey !== firstTurnKeyRef.current)
      container.scrollTop += container.scrollHeight - scrollHeightRef.current;
    lastTurnKeyRef.current = lastTurnKey;
    firstTurnKeyRef.current = firstTurnKey;
    scrollHeightRef.current = container.scrollHeight;
  });

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    stickRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      STICK_TO_BOTTOM_PX;
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
      <div className="flex w-full max-w-[660px] min-w-[270px] flex-col gap-[40px] px-[16px] pt-[40px] pb-[32px]">
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
