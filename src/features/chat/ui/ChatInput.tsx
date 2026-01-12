import { useState } from "react";

type Props = {
  placeholder?: string;
  onSend: (text: string) => void;
};

export function ChatInput({ placeholder, onSend }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const isDisabled = text.trim().length === 0;

  return (
    <div className="absolute right-0 bottom-0 left-0 bg-transparent">
      {/* 우측 패널 기준 양 옆 40px 간격 유지하며 반응형 */}
      <div className="mx-[40px] pb-6">
        <div
          className={[
            "relative flex h-[119px] w-full items-start gap-[10px] px-[20px] py-[12px]",
            "rounded-[16px] border-[0.5px] border-[#C6C6C6]",
            "bg-[rgba(255,255,255,0.40)]",
            "shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)]",
          ].join(" ")}
        >
          <textarea
            className="h-full flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-gray-400"
            placeholder={placeholder ?? "요청을 입력하세요."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter 전송 / Shift+Enter 줄바꿈
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isDisabled) {
                  handleSend();
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
