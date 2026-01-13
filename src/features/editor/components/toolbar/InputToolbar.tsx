import { useRef, useState } from "react";
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
  onSend: () => void;
  onToolSelect?: (toolName: string) => void;
}

export const InputToolbar = ({
  variant = "home", // Prop still exists but styles are unified
  isMathOpen,
  onToggleMath,
  onSend,
  onToolSelect,
}: InputToolbarProps) => {
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
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
  const containerClass = "flex items-end justify-between w-full";

  // 2. Left Group Gap
  const leftGroupClass = "flex items-center gap-[20px]";

  // 3. Button Classes (Unified to Home Specs)
  const clipClass =
    "w-[56px] h-[32px] rounded-[20px] pl-[15px] pr-[18px] py-[10px] gap-[10px]";
  const mathButtonClass =
    "w-[124px] h-[32px] rounded-[20px] px-[35px] py-[12px]";
  const canvasButtonClass =
    "w-[100px] h-[32px] rounded-[20px] px-[35px] py-[12px]";
  const toolButtonClass =
    "w-[120px] h-[32px] rounded-[20px] pl-[12px] pr-[35px] py-[12px] gap-[12px]";
  const sendButtonClass = "w-[53px] h-[48px] rounded-[12px] p-[14px]";

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
        <ToolButton className={canvasButtonClass}>
          <span className="whitespace-nowrap">캔버스</span>
        </ToolButton>

        {/* Tool Dropdown Button */}
        <ToolButton
          as="div"
          className={`${toolButtonClass} group relative !justify-start overflow-visible`}
          onMouseLeave={closeMenu}
          onClick={openMenu}
        >
          {/* Tool Icon */}
          <ToolIcon className="h-[26px] w-[26px] shrink-0" />

          {/* Label */}
          <span className="font-medium whitespace-nowrap">도구</span>

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

          {/* Dropdown Menu */}
          {isToolMenuOpen && (
            <ToolDropdownMenu
              className="top-[calc(100%+8px)] left-0"
              onSelect={(tool) => {
                onToolSelect?.(tool);
                closeMenu();
              }}
              onClose={closeMenu}
              onMouseEnter={openMenu}
            />
          )}
        </ToolButton>
      </div>

      {/* Send Button */}
      <ToolButton
        onClick={onSend}
        className={`${sendButtonClass} !duration-300 !ease-out`}
      >
        <SendIcon className="h-full w-full shrink-0" />
      </ToolButton>
    </div>
  );
};
