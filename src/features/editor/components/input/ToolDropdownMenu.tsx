import { ToolButton } from "../toolbar/ToolButton";
import type { ToolDto } from "../../types/editor_types";

interface ToolDropdownMenuProps {
  tools: ToolDto[];
  onSelect: (toolName: string) => void;
  onClose: () => void;
  onClear?: () => void;
  activeToolName?: string | null;
  className?: string; // For positioning
  style?: React.CSSProperties; // For dynamic positioning (Portal)
  focusedIndex?: number | null; // 키보드 네비게이션용 포커스 인덱스
  onFocusChange?: (index: number) => void; // 마우스 호버 시 포커스 변경 업데이트
}

export const ToolDropdownMenu = ({
  tools,
  onSelect,
  onClose,
  onClear,
  activeToolName,
  className = "",
  style,
  focusedIndex = null,
  onFocusChange,
}: ToolDropdownMenuProps) => {
  return (
    <div
      className={`animate-in fade-in slide-in-from-top-2 absolute z-50 flex w-[180px] flex-col gap-1 rounded-[12px] border-[0.5px] border-[#DFDFDF] bg-white p-2 shadow-lg duration-200 ${className}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {tools.length === 0 ? (
        <div className="flex h-[32px] items-center justify-center text-[13px] text-[#9CA4B0]">
          도구 없음
        </div>
      ) : (
        tools.map((tool, index) => {
          const isFocused = focusedIndex === index;
          const isActive = activeToolName === tool.name;
          // 스타일 조건 분기: focused일 때는 파란 배경, 아닐 때는 투명 배경
          const styleClass = isFocused
            ? "!bg-[#2A6AFF] !text-white"
            : isActive
              ? "!bg-[#D27B2D]/20 !text-[#D27B2D]"
              : "!bg-transparent text-black hover:!bg-[#2A6AFF]/50 hover:!text-white active:!bg-[#2A6AFF] active:!text-white";

          return (
            <ToolButton
              key={tool.toolId}
              className={`!h-[32px] w-full !justify-start !gap-[4px] !rounded-[20px] !border-none !px-[8px] !py-0 text-[14px] font-medium !duration-200 ${styleClass}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => {
                if (onFocusChange) onFocusChange(index);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(tool.name);
                onClose();
              }}
            >
              <div className="h-4 w-4 shrink-0 rounded bg-[#C7C7C7]" />
              <span>{tool.name}</span>
            </ToolButton>
          );
        })
      )}

      {/* 취소 버튼 - 도구 선택 시에만 표시 */}
      {activeToolName && (
        <>
          <ToolButton
            className="!h-[32px] w-full !justify-center !gap-[4px] !rounded-[20px] !border-[0.5px] !border-[#D1D6DE] !bg-[#F1F4F8] !px-[8px] !py-0 text-[14px] font-medium text-black !duration-200 hover:!bg-[#2A6AFF]/50 hover:!text-white active:!bg-[#2A6AFF] active:!text-white"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
              onClose();
            }}
          >
            <span>취소</span>
          </ToolButton>
        </>
      )}
    </div>
  );
};
