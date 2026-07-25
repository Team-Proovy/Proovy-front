import { useEffect, useState } from "react";
import { SparkleIcon } from "@/shared/components/icons/SparkleIcon";
import { STATUS_BAR_BASE_CLASS } from "./status_bar_styles";

interface ThinkingBarProps {
  /** 서버에서 전달받은 진행 상황 텍스트 (없으면 기본 메시지) */
  statusText?: string;
}

/**
 * AI 응답 생성 중 로딩 바
 *
 * Figma: 설명 텍스트 바 (node 1302:4015)
 * - 스파클 아이콘이 #2A6AFF ↔ #6B7280 사이에서 깜빡이는 애니메이션
 * - 서버 message(custom) 이벤트의 status 텍스트를 동적 표시
 */
export const ThinkingBar = ({ statusText }: ThinkingBarProps) => {
  const [isBlue, setIsBlue] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlue((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const iconColor = isBlue ? "#2A6AFF" : "#6B7280";

  return (
    <div className={`${STATUS_BAR_BASE_CLASS} p-[16px]`}>
      <SparkleIcon
        size={24}
        color={iconColor}
        className="shrink-0 transition-colors duration-300"
      />
      <div className="min-w-0 text-[14px] leading-[20px] font-medium break-all whitespace-pre-wrap text-[#6B7280]">
        {statusText || "채팅에 대한 답변 생성중..."}
      </div>
    </div>
  );
};
