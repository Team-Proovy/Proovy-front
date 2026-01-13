import { forwardRef } from "react";

interface ChatInputAreaProps {
  onContentClick: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

export const ChatInputArea = forwardRef<HTMLDivElement, ChatInputAreaProps>(
  ({ onContentClick, onKeyDown, className }, ref) => {
    return (
      <div
        ref={ref}
        contentEditable
        className={`max-h-[200px] min-h-[60px] w-full cursor-text overflow-y-auto text-[18px] leading-[28px] tracking-[-0.01em] text-gray-800 empty:before:text-gray-400 empty:before:content-['@을_통해_도구를_선택하거나,_요청을_입력하세요.'] focus:outline-none ${className}`}
        onClick={onContentClick}
        onInput={(e) => {
          // 브라우저가 다 지워도 <br>을 남기는 경우 처리 (placeholder 보이게 하기 위함)
          if (e.currentTarget.innerHTML === "<br>") {
            e.currentTarget.innerHTML = "";
          }
        }}
        onKeyDown={onKeyDown}
      />
    );
  },
);

ChatInputArea.displayName = "ChatInputArea";
