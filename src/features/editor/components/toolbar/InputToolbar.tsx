import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipIcon,
  DropdownIcon,
  SendIcon,
  ToolIcon,
} from "../../../../shared/components/icons/ChatInputIcons";
import { ToolButton } from "./ToolButton";
import { ToolDropdownMenu } from "../input/ToolDropdownMenu";

interface InputToolbarProps {
  variant?: "home" | "chat";
  isMathOpen: boolean;
  onToggleMath: () => void;
  isCanvasOpen?: boolean;
  onToggleCanvas?: () => void;
  onSend: () => void;
  onToolSelect?: (toolName: string) => void;
  activeToolName?: string | null;
  hasContent?: boolean;
}

export const InputToolbar = ({
  variant = "home", // Prop still exists but styles are unified
  isMathOpen,
  onToggleMath,
  isCanvasOpen = false,
  onToggleCanvas,
  onSend,
  onToolSelect,
  activeToolName,
  hasContent = false,
}: InputToolbarProps) => {
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolTriggerRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (toolTriggerRef.current) {
      const rect = toolTriggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 180; // Approximate height of dropdown menu

      if (spaceBelow < menuHeight) {
        // Not enough space below: Open UPWARDS
        setMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
        });
      } else {
        // Enough space below: Open DOWNWARDS (Default)
        setMenuPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
    setIsToolMenuOpen(true);
  };

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsToolMenuOpen(false);
    }, 150);
  };

  // Unified Styles (Based on Home Variant Specs)

  // 1. Container: Use consistent padding/alignment.
  // 'home' uses items-end (bottom align buttons). 'chat' might want bottom align too if we use large buttons.
  // We'll use 'items-end' to be safe.
  // 1. Container: Use consistent padding/alignment.
  // 'home' uses items-end (bottom align buttons). 'chat' might want bottom align too if we use large buttons.
  // We'll use 'items-end' to be safe.
  // Changed to gap-2 to prevent overlap with Send button, and allow Left Group to take remaining space (flex-1)
  const containerClass = "flex items-end gap-2 w-full";

  // 2. Left Group Gap
  // Added overflow-x-auto to allow scrolling on small screens (laptop)
  // Added flex-1 to occupy available space
  // Added pb-1 and no-scrollbar (utility or style) to clean up UI
  const leftGroupClass =
    "flex items-center gap-[20px] overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden";

  // 3. Button Classes (Unified to Home Specs)
  // Added shrink-0 to prevent buttons from being squished
  const clipClass =
    "w-[56px] h-[32px] rounded-[20px] pl-[15px] pr-[18px] py-[10px] gap-[10px] shrink-0";
  const mathButtonClass =
    "w-[124px] h-[32px] rounded-[20px] px-[35px] py-[12px] shrink-0";
  const canvasButtonClass =
    "w-[100px] h-[32px] rounded-[20px] px-[35px] py-[12px] shrink-0";

  // Dynamic Tool Button Logic
  const isActiveTool = !!activeToolName;
  const toolButtonBase =
    "h-[32px] rounded-[20px] py-[12px] gap-[12px] shrink-0 duration-200 transition-colors";
  // Width logic: Fixed 120px for "도구", auto/min-width for active tool if needed, or keep 120px?
  // "용어" is 2 chars, same as "도구". "그래프 그리기" is longer.
  // Let's allow width to adapt or keep it ample. Figma shows "용어" which fits in the same space.
  // If the text is long, it might overflow. Let's start with auto width padding.
  const toolButtonLayout = "pl-[12px] pr-[35px] min-w-[120px]";

  const toolButtonStyle = isActiveTool
    ? "!bg-[#FFEAD7] !text-[#D27B2D]" // Active: Orange background & Text
    : ""; // Default (ToolButton default style)

  const toolButtonClass = `${toolButtonBase} ${toolButtonLayout} ${toolButtonStyle}`;

  // Unused variant styles removed
  // const homeSendButtonClass = ...
  // const chatSendButtonClass = ...

  // NEW: Force Blue Square Send Button if requested matching Figma design
  // (User asked for "this design" -> Send button is blue square)
  // Overriding standard variant styles to match the Figma screenshot provided
  const sendButtonClass = "w-[53px] h-[48px] rounded-[12px] p-[14px] shrink-0";

  return (
    <div className={containerClass}>
      {/* Left Toolbar Group */}
      <div className={leftGroupClass}>
        {/* Clip Button */}
        <ToolButton
          className={clipClass}
          title="파일 첨부"
        >
          <ClipIcon className="h-[17px] w-[17px] shrink-0" />
        </ToolButton>

        {/* Math Toggle Button */}
        <ToolButton
          onClick={onToggleMath}
          isActive={isMathOpen}
          className={mathButtonClass}
        >
          <span className="whitespace-nowrap">수식 입력기</span>
        </ToolButton>

        {/* Canvas Button */}
        <ToolButton
          onClick={onToggleCanvas}
          isActive={isCanvasOpen}
          className={canvasButtonClass}
        >
          <span className="whitespace-nowrap">캔버스</span>
        </ToolButton>

        {/* Tool Dropdown Button */}
        <ToolButton
          ref={toolTriggerRef}
          as="div"
          className={`${toolButtonClass} group relative !justify-start overflow-visible`}
          onMouseLeave={closeMenu}
          onClick={openMenu}
        >
          {/* Tool Icon - Inherits color due to text status if using currentColor, otherwise needs specific prop */}
          <ToolIcon className="h-[26px] w-[26px] shrink-0" />

          {/* Label */}
          <span className="font-medium whitespace-nowrap">
            {activeToolName || "도구"}
          </span>

          {/* Dropdown Trigger Icon */}
          <div
            className="absolute top-0 right-0 bottom-0 flex w-[40px] cursor-pointer items-center justify-end pr-[17px]"
            onMouseEnter={openMenu}
            onClick={(e) => {
              e.stopPropagation();
              openMenu();
            }}
          >
            <DropdownIcon className="h-[10px] w-[15px] shrink-0" />
          </div>

          {/* Dropdown Menu - Rendered via Portal */}
          {isToolMenuOpen &&
            menuPos &&
            createPortal(
              <ToolDropdownMenu
                className={`!fixed !z-[9999] ${menuPos.bottom !== undefined ? "animate-in slide-in-from-bottom-2 origin-bottom" : ""}`}
                style={{
                  top: menuPos.top,
                  bottom: menuPos.bottom,
                  left: menuPos.left,
                }}
                onSelect={(tool) => {
                  onToolSelect?.(tool);
                  closeMenu();
                }}
                onClose={closeMenu}
                onMouseEnter={openMenu}
              />,
              document.body,
            )}
        </ToolButton>
      </div>

      {/* Send Button */}
      <ToolButton
        onClick={hasContent ? onSend : undefined}
        className={`${sendButtonClass} !duration-300 !ease-out ${
          hasContent
            ? "!border-[#2A6AFF] !bg-[#2A6AFF] !text-white"
            : "!cursor-default hover:!border-[#C6C6C6] hover:!bg-[#F5F5F5] hover:!text-[#666]"
        }`}
      >
        <SendIcon className="h-full w-full shrink-0" />
      </ToolButton>
    </div>
  );
};
