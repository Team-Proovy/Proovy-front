import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipIcon,
  DropdownIcon,
  SendIcon,
  ToolIcon,
} from "../../../../shared/components/icons/ChatInputIcons";
import { ToolButton } from "./ToolButton";
import { ToolDropdownMenu } from "../input/ToolDropdownMenu";
import {
  BUTTON_LAYOUT,
  CLIP_BUTTON_STYLE,
  PILL_BUTTON_STYLE,
  getButtonClass,
  getSendButtonClass,
  getToolButtonClass,
} from "../../constants/toolbar_styles";

interface InputToolbarProps {
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

  // 메뉴 열기/닫기 핸들러
  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (toolTriggerRef.current) {
      const rect = toolTriggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 180;

      if (spaceBelow < menuHeight) {
        setMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
        });
      } else {
        setMenuPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
    setIsToolMenuOpen(true);
  };

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => setIsToolMenuOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // 도구 버튼 활성 상태
  const isActiveTool = !!activeToolName;

  return (
    <div className="flex w-full items-end gap-2">
      {/* 왼쪽 버튼 그룹 */}
      <div className="flex flex-1 items-center gap-[20px] overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {/* 클립 버튼 */}
        <ToolButton
          className={getButtonClass(
            BUTTON_LAYOUT.clip,
            CLIP_BUTTON_STYLE,
            false,
          )}
          title="파일 첨부"
        >
          <ClipIcon className="h-[17px] w-[17px] shrink-0" />
        </ToolButton>

        {/* 수식 입력기 버튼 */}
        <ToolButton
          onClick={onToggleMath}
          className={getButtonClass(
            BUTTON_LAYOUT.math,
            PILL_BUTTON_STYLE,
            isMathOpen,
          )}
        >
          <span className="whitespace-nowrap">수식 입력기</span>
        </ToolButton>

        {/* 캔버스 버튼 */}
        <ToolButton
          onClick={onToggleCanvas}
          className={getButtonClass(
            BUTTON_LAYOUT.canvas,
            PILL_BUTTON_STYLE,
            isCanvasOpen,
          )}
        >
          <span className="whitespace-nowrap">캔버스</span>
        </ToolButton>

        {/* 도구 버튼 */}
        <ToolButton
          ref={toolTriggerRef}
          as="div"
          className={`${getToolButtonClass(isActiveTool)} group relative overflow-visible`}
          onMouseLeave={closeMenu}
          onClick={openMenu}
        >
          {/* 왼쪽: 도구 아이콘 */}
          <ToolIcon className="h-[26px] w-[26px] shrink-0" />

          {/* 중앙: 텍스트 (자동 너비 조정, 중앙 정렬) */}
          <span className="flex-1 text-center whitespace-nowrap">
            {activeToolName || "도구"}
          </span>

          {/* 오른쪽: 드롭다운 아이콘 */}
          <div
            className="flex shrink-0 cursor-pointer items-center"
            onMouseEnter={openMenu}
            onClick={(e) => {
              e.stopPropagation();
              openMenu();
            }}
          >
            <DropdownIcon className="h-[10px] w-[15px]" />
          </div>

          {/* 드롭다운 메뉴 (Portal) */}
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
                onSelect={(tool) => onToolSelect?.(tool)}
                onClose={closeMenu}
                onMouseEnter={openMenu}
              />,
              document.body,
            )}
        </ToolButton>
      </div>

      {/* 전송 버튼 */}
      <ToolButton
        onClick={hasContent ? onSend : undefined}
        className={getSendButtonClass(hasContent)}
      >
        <SendIcon className="h-[16px] w-[14px] shrink-0" />
      </ToolButton>
    </div>
  );
};
