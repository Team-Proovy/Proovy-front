import { ToolButton } from "../toolbar/ToolButton";

interface ToolDropdownMenuProps {
  onSelect: (toolName: string) => void;
  onClose: () => void;
  className?: string; // For positioning
  onMouseEnter?: () => void;
  focusedIndex?: number | null; // 키보드 네비게이션용 포커스 인덱스
  onFocusChange?: (index: number) => void; // 마우스 호버 시 포커스 변경 업데이트
}

export const TOOLS = [
  "그래프 그리기",
  "해설지 생성하기",
  "캔버스 열기",
  "코드 검산 진행하기",
];

export const ToolDropdownMenu = ({
  onSelect,
  onClose,
  className = "",
  onMouseEnter,
  focusedIndex = null,
  onFocusChange,
}: ToolDropdownMenuProps) => {
  return (
    <div
      className={`animate-in fade-in slide-in-from-top-2 absolute z-50 flex w-[180px] flex-col gap-1 rounded-[12px] border-[0.5px] border-[#DFDFDF] bg-white p-2 shadow-lg duration-200 ${className}`}
      onMouseEnter={onMouseEnter}
      onClick={(e) => e.stopPropagation()}
    >
      {TOOLS.map((item, index) => {
        const isFocused = focusedIndex === index;
        // 스타일 조건 분기: focused일 때는 파란 배경, 아닐 때는 투명 배경
        const styleClass = isFocused
          ? "!bg-[#2A6AFF] !text-white"
          : "!bg-transparent text-black hover:!bg-[#2A6AFF] hover:!text-white";

        return (
          <ToolButton
            key={item}
            isActive={false} // isActive는 내부 bg-blue-100 스타일을 쓰므로 끔
            className={`!h-[32px] w-full !justify-start !gap-[4px] !rounded-[20px] !border-none !px-[8px] !py-0 text-[14px] font-medium !duration-200 ${styleClass}`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => {
              if (onFocusChange) onFocusChange(index);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
              onClose();
            }}
          >
            <div className="h-4 w-4 shrink-0 rounded bg-[#C7C7C7]" />
            {/* 아이콘박스 색상도 텍스트처리가 안되므로 수동 조절 필요할 수 있음.
                 ToolButton children에서 isFocused 여부를 알기 어려우므로 ClassName으로 제어하거나 여기서 조작.
                 간단히 bg-white로 변경. */}
            <span>{item}</span>
          </ToolButton>
        );
      })}
    </div>
  );
};
