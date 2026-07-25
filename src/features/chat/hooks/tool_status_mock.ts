import type { ChatMessage } from "../types/chat_types";

/**
 * 도구 상태바(ToolStatusBar) UI 확인용 목업 데이터
 *
 * 개발 환경(`import.meta.env.DEV`)에서 `?toolStatusMock=true` 쿼리 파라미터가
 * 있을 때만 사용된다. 실제 SSE 이벤트 연동 시 제거 예정.
 */
export const MOCK_TOOL_STATUSES: NonNullable<ChatMessage["toolStatuses"]> = [
  {
    id: "mock-python-create",
    icon: "python",
    label: "파이썬 코드 생성 중...",
  },
  {
    id: "mock-python-calculate",
    icon: "python",
    label: "파이썬 코드로 문제의 정답 계산 중...",
  },
  {
    id: "mock-transform-create",
    icon: "transform",
    label: "변형 문제가 생성되는 중...",
  },
];

/** 첫 번째 assistant 메시지에 목업 도구 상태바를 주입한다. */
export const withMockToolStatuses = (
  messages: ChatMessage[],
): ChatMessage[] => {
  const firstAssistantIndex = messages.findIndex(
    (message) => message.role === "assistant",
  );

  if (firstAssistantIndex === -1) return messages;

  return messages.map((message, index) =>
    index === firstAssistantIndex
      ? { ...message, toolStatuses: MOCK_TOOL_STATUSES }
      : message,
  );
};
