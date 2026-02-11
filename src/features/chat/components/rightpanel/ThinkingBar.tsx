import { useEffect, useState } from "react";
import { SparkleIcon } from "@/shared/components/icons/SparkleIcon";

/**
 * AI 응답 생성 중 로딩 바
 *
 * Figma: 설명 텍스트 바 (node 1302:4015)
 * - 스파클 아이콘이 #2A6AFF ↔ #6B7280 사이에서 깜빡이는 애니메이션
 * - "채팅에 대한 답변 생성중..." 텍스트 표시
 */
export const ThinkingBar = () => {
  const [isBlue, setIsBlue] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlue((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const iconColor = isBlue ? "#2A6AFF" : "#6B7280";

  return (
    <div className="flex h-[30px] w-full items-center gap-[8px] overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#E3E7ED] p-[10px]">
      <SparkleIcon
        size={24}
        color={iconColor}
        className="shrink-0 transition-colors duration-300"
      />
      <div className="shrink-0 text-[14px] leading-[20px] font-medium break-all whitespace-pre-wrap text-[#6B7280]">
        채팅에 대한 답변 생성중...
      </div>
    </div>
  );
};
