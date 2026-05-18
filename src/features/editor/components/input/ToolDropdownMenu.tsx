import { ToolButton } from "../toolbar/ToolButton";
import type { ToolDto } from "../../types/editor_types";

/** 도구별 아이콘 렌더링 (iconType 기반) */
export const ToolItemIcon = ({
  iconType,
  className = "h-[26px] w-[26px] shrink-0",
}: {
  iconType: string;
  className?: string;
}) => {
  const iconClass = className;

  switch (iconType) {
    // 용어 (GRAPH)
    case "chart_line":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.2936 18.9385H8.71188V19.8793H13.2936V18.9385Z"
            fill="currentColor"
          />
          <path
            d="M15.608 11.2708C15.608 8.73066 13.5476 6.67029 11.0075 6.67029C8.46727 6.67029 6.40691 8.73066 6.40691 11.2708C6.40691 12.7573 7.12192 14.065 8.21326 14.9024H8.18503L8.75893 18.1481H13.2372L13.8205 14.9024H13.7922C14.8836 14.065 15.5986 12.7573 15.5986 11.2708H15.608Z"
            fill="url(#tool_icon_chart_line)"
          />
          <path
            d="M14.5682 4.1286L13.2976 6.51111L14.1278 6.95381L15.3983 4.57129L14.5682 4.1286Z"
            fill="currentColor"
          />
          <path
            d="M16.993 5.82045L14.9465 7.58191L15.5603 8.29495L17.6067 6.5335L16.993 5.82045Z"
            fill="currentColor"
          />
          <defs>
            <linearGradient
              id="tool_icon_chart_line"
              x1="11.0075"
              y1="6.67029"
              x2="11.0075"
              y2="18.1481"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop
                offset="1"
                stopColor="currentColor"
                stopOpacity="0.5"
              />
            </linearGradient>
          </defs>
        </svg>
      );

    // 해설지 생성하기 (SOLUTION)
    case "file_text":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.7436 7.29132V19.5218H6.25636V4.57239H11.7695L14.5449 9.35169L15.8526 7.41363L17.7436 7.29132Z"
            fill="url(#tool_icon_file_text)"
          />
          <path
            d="M14.4884 10.3489L16.069 7.80873H17.7436V6.76443H15.4575L14.4884 8.33558L12.0706 4.47827H6.25636V5.51316H11.4684L14.4884 10.3489Z"
            fill="currentColor"
          />
          <path
            d="M16.6993 11.045H7.30066V11.9859H16.6993V11.045Z"
            fill="currentColor"
          />
          <path
            d="M16.6993 13.6793H7.30066V14.6201H16.6993V13.6793Z"
            fill="currentColor"
          />
          <path
            d="M12.1835 17.6401H7.30066V19.5218H12.1835V17.6401Z"
            fill="currentColor"
          />
          <defs>
            <linearGradient
              id="tool_icon_file_text"
              x1="12"
              y1="4.57239"
              x2="12"
              y2="19.5218"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" />
              <stop
                offset="1"
                stopColor="currentColor"
                stopOpacity="0.5"
              />
            </linearGradient>
          </defs>
        </svg>
      );

    // 캔버스 열기 (CANVAS)
    case "copy_plus":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.427 16.6429L13.1996 14.9589L10.0479 12.5598"
            fill="currentColor"
          />
          <path
            d="M16.2793 4.45942L10.4685 12.0845L13.5739 14.451L19.3847 6.82595L16.2793 4.45942Z"
            fill="url(#tool_icon_copy_plus)"
          />
          <path
            d="M18.0822 19.5499H5.29663V5.36255H13.3123V6.30336H6.23744V18.6091H17.1414V11.3931H18.0822V19.5499Z"
            fill="currentColor"
          />
          <defs>
            <linearGradient
              id="tool_icon_copy_plus"
              x1="17.832"
              y1="5.64269"
              x2="12.0212"
              y2="13.2677"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="currentColor" />
              <stop
                offset="1"
                stopColor="white"
              />
            </linearGradient>
          </defs>
        </svg>
      );

    // 코드 검산 진행하기 (CODE_CHECK)
    case "code":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.97128 16.9629H4.22412V16.1539H6.62318L9.11632 13.5854L11.1391 15.2883L10.6122 15.9092L9.17277 14.6956L6.97128 16.9629Z"
            fill="currentColor"
          />
          <path
            d="M11.186 15.2506L14.4318 13.8017L11.7223 11.7319"
            fill="currentColor"
          />
          <path
            d="M17.0948 4.74091L12.0823 11.3184L14.7611 13.3599L19.7736 6.7824L17.0948 4.74091Z"
            fill="url(#tool_icon_code)"
          />
          <path
            d="M9.63405 8.36377H8.42041V13.3312H9.63405V8.36377Z"
            fill="currentColor"
          />
          <path
            d="M11.5156 10.2358H6.5481V11.4495H11.5156V10.2358Z"
            fill="currentColor"
          />
          <path
            d="M17.7907 15.8994H12.8232V17.1131H17.7907V15.8994Z"
            fill="currentColor"
          />
          <path
            d="M16.1066 14.5686C16.1066 14.1243 15.7464 13.7642 15.3022 13.7642C14.8579 13.7642 14.4978 14.1243 14.4978 14.5686C14.4978 15.0128 14.8579 15.3729 15.3022 15.3729C15.7464 15.3729 16.1066 15.0128 16.1066 14.5686Z"
            fill="currentColor"
          />
          <path
            d="M16.1066 18.4636C16.1066 18.0193 15.7464 17.6592 15.3022 17.6592C14.8579 17.6592 14.4978 18.0193 14.4978 18.4636C14.4978 18.9078 14.8579 19.268 15.3022 19.268C15.7464 19.268 16.1066 18.9078 16.1066 18.4636Z"
            fill="currentColor"
          />
          <defs>
            <linearGradient
              id="tool_icon_code"
              x1="17.4203"
              y1="4.989"
              x2="11.7325"
              y2="7.99218"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="currentColor" />
              <stop
                offset="1"
                stopColor="white"
              />
            </linearGradient>
          </defs>
        </svg>
      );

    // 기본 폴백
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
      className={`animate-in fade-in slide-in-from-top-2 absolute z-50 flex w-max min-w-[180px] flex-col gap-1 rounded-[12px] border-[0.5px] border-[#DFDFDF] bg-white p-2 shadow-lg duration-200 ${className}`}
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
          const styleClass = isFocused
            ? "bg-[#2A6AFF]! text-white!"
            : isActive
              ? "bg-[#D27B2D]/20! text-[#D27B2D]!"
              : "bg-transparent! text-black hover:bg-[#2A6AFF]/50! hover:text-white! active:bg-[#2A6AFF]! active:text-white!";
          // 아이콘 색상: 기본 파란색, hover/focus 시 흰색, active 시 주황색
          const iconColorClass = isFocused
            ? "text-white!"
            : isActive
              ? "text-[#D27B2D]"
              : "text-[#2A6AFF] group-hover:text-white!";

          return (
            <ToolButton
              key={tool.toolId}
              className={`group h-[32px]! w-full justify-start! gap-[4px]! rounded-[20px]! border-none! px-[8px]! py-0! text-[14px] font-medium duration-200! ${styleClass}`}
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
              <ToolItemIcon
                iconType={tool.iconType}
                className={`h-[26px] w-[26px] shrink-0 ${iconColorClass}`}
              />
              <span className="whitespace-nowrap">{tool.name}</span>
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
