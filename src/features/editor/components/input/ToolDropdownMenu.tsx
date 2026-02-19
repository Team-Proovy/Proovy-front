import { ToolButton } from "../toolbar/ToolButton";
import type { ToolDto } from "../../types/editor_types";

/** 도구별 아이콘 렌더링 (iconType 기반) */
const ToolItemIcon = ({ iconType }: { iconType: string }) => {
  const iconClass = "h-4 w-4 shrink-0";

  switch (iconType) {
    // 문제 해결 - 전구 아이콘
    case "chart_line":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 2V3.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M15.66 4.34L14.81 5.19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M18 10H16.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4.34 4.34L5.19 5.19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M2 10H3.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.5 15V14.2C7.5 13.5 7 12.9 6.5 12.3C5.8 11.5 5.2 10.5 5.2 9.3C5.2 6.7 7.4 4.6 10 4.6C12.6 4.6 14.8 6.7 14.8 9.3C14.8 10.5 14.2 11.5 13.5 12.3C13 12.9 12.5 13.5 12.5 14.2V15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 17.5H12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    // 해설지 생성하기 - 문서 아이콘
    case "file_text":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2H5C4.45 2 4 2.45 4 3V17C4 17.55 4.45 18 5 18H15C15.55 18 16 17.55 16 17V6L12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 2V6H16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 10H13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 13H13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 16H10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    // 개념 설명 - 말풍선 아이콘
    case "copy_plus":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 3.5C3 2.95 3.45 2.5 4 2.5H16C16.55 2.5 17 2.95 17 3.5V12.5C17 13.05 16.55 13.5 16 13.5H11L7 17V13.5H4C3.45 13.5 3 13.05 3 12.5V3.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 6.5H13.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.5 9.5H11.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    // 기본 폴백 - 원형 점
    default:
      return (
        <div className="h-3 w-3 shrink-0 rounded-full bg-current opacity-40" />
      );
  }
};

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
      data-menu-dropdown="at"
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
            ? "bg-[#2A6AFF]! text-white!"
            : isActive
              ? "bg-[#D27B2D]/20! text-[#D27B2D]!"
              : "bg-transparent! text-black hover:bg-[#2A6AFF]/50! hover:text-white! active:bg-[#2A6AFF]! active:text-white!";

          return (
            <ToolButton
              key={tool.toolId}
              className={`h-[32px]! w-full justify-start! gap-[4px]! rounded-[20px]! border-none! px-[8px]! py-0! text-[14px] font-medium duration-200! ${styleClass}`}
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
              <ToolItemIcon iconType={tool.iconType} />
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
