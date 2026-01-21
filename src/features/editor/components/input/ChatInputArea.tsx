import { forwardRef } from "react";

interface ChatInputAreaProps {
  onContentClick: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onContentChange?: (hasContent: boolean) => void;
  onSubmit?: () => void;
  className?: string;
}

export const ChatInputArea = forwardRef<HTMLDivElement, ChatInputAreaProps>(
  (
    { onContentClick, onKeyDown, onContentChange, onSubmit, className },
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

    return (
      <div
        ref={ref}
        contentEditable
        className={`max-h-[200px] min-h-[50px] w-full cursor-text overflow-y-auto text-[18px] leading-[28px] tracking-[-0.01em] break-all whitespace-pre-wrap text-gray-800 empty:before:text-[#666666] empty:before:content-['@을_통해_도구를_선택하거나,_요청을_입력하세요.'] focus:outline-none ${className}`}
        onClick={onContentClick}
        onInput={(e) => {
          // 브라우저가 다 지워도 <br>을 남기는 경우 처리 (placeholder 보이게 하기 위함)
          if (e.currentTarget.innerHTML === "<br>") {
            e.currentTarget.innerHTML = "";
          }
          // 내용 유무 콜백
          const text = e.currentTarget.textContent?.trim() || "";
          onContentChange?.(text.length > 0);
        }}
        onKeyDown={handleKeyDown}
      />
    );
  },
);

ChatInputArea.displayName = "ChatInputArea";
