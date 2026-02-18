import { forwardRef } from "react";

interface ChatInputAreaProps {
  onContentClick: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onContentChange?: (hasContent: boolean) => void;
  onSubmit?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * 커스텀 스크롤바 스타일 (Figma 디자인 기반)
 * - 트랙: #F1F4F8 (Gray 1)
 * - 썸: #9CA4B0 (Gray 4)
 * - 너비: 8px, 둥근 모서리: 4px
 */
const SCROLLBAR_STYLES = `
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-[4px]
  [&::-webkit-scrollbar-track]:bg-[#F1F4F8]
  [&::-webkit-scrollbar-thumb]:rounded-[4px]
  [&::-webkit-scrollbar-thumb]:bg-[#9CA4B0]
  [&::-webkit-scrollbar-thumb]:shadow-[0px_4px_4px_rgba(0,0,0,0.25)]
`;

export const ChatInputArea = forwardRef<HTMLDivElement, ChatInputAreaProps>(
  (
    {
      onContentClick,
      onKeyDown,
      onContentChange,
      onSubmit,
      className,
      disabled = false,
    },
    ref,
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // 먼저 부모의 키 핸들러 호출 (메뉴 처리 등)
      onKeyDown?.(e);

      // 이미 처리된 경우 (preventDefault 호출됨) 여기서 중단
      if (e.defaultPrevented) return;

      // Enter = 전송, Shift+Enter = 줄바꿈
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
        return;
      }
    };

    /**
     * 붙여넣기 시 plain text만 붙여넣기 (스타일 제거)
     */
    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    };

    return (
      <div
        className={`flex min-h-0 w-full min-w-0 flex-col gap-2 ${className || ""}`}
      >
        {/* 채팅 입력 영역 (위로 확장) */}
        <div
          ref={ref}
          contentEditable={!disabled}
          className={`min-h-[50px] w-full flex-1 cursor-text overflow-x-hidden overflow-y-auto pr-2 text-[18px] leading-[28px] tracking-[-0.01em] break-words whitespace-pre-wrap text-gray-800 empty:before:text-[#9CA4B0] empty:before:content-['@을_통해_도구를_선택하거나,_요청을_입력하세요.'] focus:outline-none ${SCROLLBAR_STYLES} ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
          onClick={disabled ? undefined : onContentClick}
          onInput={(e) => {
            if (disabled) return;
            // 브라우저가 다 지워도 <br>을 남기는 경우 처리 (placeholder 보이게 하기 위함)
            if (e.currentTarget.innerHTML === "<br>") {
              e.currentTarget.innerHTML = "";
            }
            // 내용 유무 콜백
            const text = e.currentTarget.textContent?.trim() || "";
            onContentChange?.(text.length > 0);
          }}
          onKeyDown={disabled ? undefined : handleKeyDown}
          onPaste={disabled ? undefined : handlePaste}
        />
      </div>
    );
  },
);

ChatInputArea.displayName = "ChatInputArea";
