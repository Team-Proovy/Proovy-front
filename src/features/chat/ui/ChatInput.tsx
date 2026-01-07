import { useState } from "react";
import { SendArrowIcon, ToolIcon } from "./SidebarIcons";

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

          {/* 하단 퀵 액션 버튼들 */}
          <div className="pointer-events-none absolute bottom-[12px] left-[20px] flex items-center gap-[20px]">
            {/* 1) 링크 버튼 */}
            <button
              type="button"
              className="pointer-events-auto flex h-[28px] w-[56px] items-center gap-[10px] rounded-[20px] border-[0.5px] border-[#C6C6C6] bg-[#F5F5F5] px-[15px] py-[10px]"
            >
              <svg
                className="h-6 w-6 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9.36102 19.7194C8.67423 19.7194 8.00625 19.4277 7.44177 18.8632C6.7832 18.2047 6.45392 17.4802 6.45392 16.7182C6.45392 15.5986 7.19716 14.8554 7.28183 14.7707L13.9239 8.12861L14.9212 9.12586L8.26968 15.7774C8.04389 16.0032 7.39473 16.8311 8.42962 17.866C8.74008 18.1764 9.06937 18.3176 9.38924 18.3081C9.98195 18.2893 10.5652 17.7625 10.7346 17.5555L18.3081 9.982C18.468 9.65272 19.0984 8.10979 17.5554 6.57628C15.7867 4.80756 14.1874 6.21877 14.1779 6.23759C13.9992 6.40693 4.99567 15.4199 4.99567 15.4199L3.99841 14.4226C3.99841 14.4226 13.0208 5.40967 13.1995 5.23092C13.3783 5.05217 14.0651 4.52532 15.0153 4.34656C15.8996 4.17722 17.2356 4.25248 18.5621 5.57902C20.5566 7.57353 20.0392 9.85029 19.4935 10.7723L19.39 10.9134L11.7789 18.5245C11.713 18.5998 10.7722 19.6723 9.46451 19.7288C9.42687 19.7288 9.39865 19.7288 9.36102 19.7288V19.7194Z"
                  fill="#666666"
                />
              </svg>
            </button>

            {/* 2) 수식 입력기 버튼 */}
            <button
              type="button"
              className="pointer-events-auto flex h-[28px] w-[100px] items-center justify-center gap-[10px] rounded-[20px] border-[0.5px] border-[#C6C6C6] bg-[rgba(245,245,245,1)] px-[16px] py-[12px]"
            >
              <span className="w-full shrink-0 text-center text-[12px] leading-5 font-normal text-[#666666]">
                수식 입력기
              </span>
            </button>

            {/* 3) 캔버스 버튼 */}
            <button
              type="button"
              className="pointer-events-auto flex h-[28px] w-[80px] items-center justify-center gap-[10px] rounded-[20px] border-[0.5px] border-[#C6C6C6] bg-[rgba(245,245,245,1)] px-[16px] py-[12px]"
            >
              <span className="w-full text-center text-[12px] leading-5 font-normal text-[#666666]">
                캔버스
              </span>
            </button>

            {/* 4) 도구 버튼 */}
            <button
              type="button"
              className="pointer-events-auto flex h-[28px] w-[108px] items-center gap-[12px] rounded-[20px] border-[0.5px] border-[#C6C6C6] bg-[rgba(245,245,245,1)] px-[8px]"
            >
              {/* 왼쪽 아이콘 (3개 요소 합친 아이콘) */}
              <ToolIcon className="h-6 w-6 shrink-0" />

              <span className="text-[12px] leading-5 font-normal text-[#666666]">
                도구
              </span>

              {/* 오른쪽 드롭다운 아이콘 */}
              <svg
                className="h-[7px] w-[13px] shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="7"
                viewBox="0 0 15 10"
                fill="none"
              >
                <path
                  d="M1 1L7.5 8L14 1"
                  stroke="#666666"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* 전송 버튼: 채팅입력창 오른쪽/아래쪽 12px, 위쪽 71px 간격 */}
          <button
            type="button"
            onClick={handleSend}
            className={[
              "absolute top-[71px] right-[12px]",
              // layout
              "flex h-[36px] w-[40px] items-center justify-center",
              "rounded-[12px] border-[0.5px] border-[#C6C6C6]",
              "bg-[#F5F5F5]",
              // UX: hover/active/focus states
              "cursor-pointer transition-colors",
              "hover:bg-[#E0E0E0]",
              "active:bg-[#D0D0D0]",
              "focus:ring-2 focus:ring-[#2A6AFF]/40 focus:outline-none",
            ].join(" ")}
            aria-label="전송"
          >
            <SendArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
