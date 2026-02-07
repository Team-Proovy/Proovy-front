import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipIcon,
  DropdownIcon,
  SendIcon,
  ToolIcon,
  MathIcon,
  CanvasIcon,
} from "../../../../shared/components/icons/ChatInputIcons";
import { ToolButton } from "./ToolButton";
import { ToolDropdownMenu } from "../input/ToolDropdownMenu";
import {
  BUTTON_LAYOUT,
  CLIP_BUTTON_STYLE,
  PILL_BUTTON_STYLE,
  TOOL_BUTTON_STYLE,
  getButtonClass,
  getSendButtonClass,
  getToolButtonClass,
  getCompactButtonClass,
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
  // compactLevel: 0=모두 일반, 1=도구만, 2=도구+캔버스, 3=도구+캔버스+수식, 4=모두
  const [compactLevel, setCompactLevel] = useState(0);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolTriggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 활성 도구명 기반 도구 버튼 예상 너비 계산
  // 고정 부분: pl(12) + icon(26) + gap(8) + gap(8) + dropdown(15) + pr(17) = 86px
  // 텍스트: 한글 ~14px/자, 공백 ~4px
  const estimateToolButtonWidth = (
    toolName: string | null | undefined,
  ): number => {
    if (!toolName) return 120; // "도구" 기본 min-width
    const textWidth = [...toolName].reduce(
      (w, ch) => w + (ch === " " ? 4 : 14),
      0,
    );
    return Math.max(120, 86 + textWidth);
  };

  // 컨테이너 너비 감지하여 단계별 compact 모드 전환
  // 각 버튼 너비: 클립(56), 수식(124), 캔버스(100), 도구(가변), 전송(30), compact(40)
  // 일반 gap: 20px, compact gap: 8px, 전송과의 gap: 12px
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 도구 버튼 너비에 따라 Level 0 threshold 동적 계산
    // Level 0 전체 = clip(56) + gap(20) + math(124) + gap(20) + canvas(100) + gap(20) + tool + gap(12) + send(30)
    //             = 382 + toolWidth
    const toolWidth = estimateToolButtonWidth(activeToolName);
    const level0Threshold = 382 + toolWidth;

    // 너비에 따른 compactLevel 계산 함수
    const updateCompactLevel = (width: number) => {
      // Level 0: 모두 일반 (level0Threshold 이상)
      // Level 1: 도구만 compact (410px ~ level0Threshold)
      // Level 2: 도구+캔버스 compact (338px ~ 410px)
      // Level 3: 도구+캔버스+수식 compact (242px ~ 338px)
      // Level 4: 모두 compact (242px 미만)
      if (width >= level0Threshold) setCompactLevel(0);
      else if (width >= 410) setCompactLevel(1);
      else if (width >= 338) setCompactLevel(2);
      else if (width >= 242) setCompactLevel(3);
      else setCompactLevel(4);
    };

    // 초기 측정
    updateCompactLevel(container.getBoundingClientRect().width);

    // ResizeObserver 지원 여부 확인
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        updateCompactLevel(entry.contentRect.width);
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    } else {
      // ResizeObserver 미지원 환경: window resize 폴백
      const handleResize = () => {
        const width = container.getBoundingClientRect().width;
        updateCompactLevel(width);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [activeToolName]);

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
      const menuWidth = 180;
      const margin = 16; // 화면 가장자리 여백

      // 수평 위치 계산 - 화면을 넘어가지 않도록 조정
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - margin) {
        left = window.innerWidth - menuWidth - margin;
      }
      if (left < margin) {
        left = margin;
      }

      if (spaceBelow < menuHeight) {
        setMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left,
        });
      } else {
        setMenuPos({ top: rect.bottom + 8, left });
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

  // 각 버튼의 compact 상태 (순서: 도구 -> 캔버스 -> 수식 -> 클립)
  const isToolCompact = compactLevel >= 1;
  const isCanvasCompact = compactLevel >= 2;
  const isMathCompact = compactLevel >= 3;
  const isClipCompact = compactLevel >= 4;

  return (
    <div
      ref={containerRef}
      className="flex w-full items-end gap-[12px]"
    >
      {/* 왼쪽 버튼 그룹 - 각 버튼 사이 간격은 개별 margin으로 처리 */}
      <div className="flex flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 클립 버튼 */}
        <ToolButton
          className={
            isClipCompact
              ? getCompactButtonClass(false)
              : getButtonClass(BUTTON_LAYOUT.clip, CLIP_BUTTON_STYLE, false)
          }
          title="파일 첨부"
        >
          <ClipIcon className="h-[17px] w-[17px] shrink-0" />
        </ToolButton>

        {/* 수식 입력기 버튼 */}
        <ToolButton
          onClick={onToggleMath}
          className={`${isMathCompact ? "ml-[8px]" : "ml-[20px]"} ${
            isMathCompact
              ? getCompactButtonClass(isMathOpen)
              : getButtonClass(
                  BUTTON_LAYOUT.math,
                  PILL_BUTTON_STYLE,
                  isMathOpen,
                )
          }`}
          title="수식 입력기"
        >
          {isMathCompact ? (
            <MathIcon className="h-[26px] w-[26px] shrink-0" />
          ) : (
            <span className="whitespace-nowrap">수식 입력기</span>
          )}
        </ToolButton>

        {/* 캔버스 버튼 */}
        <ToolButton
          onClick={onToggleCanvas}
          className={`${isCanvasCompact ? "ml-[8px]" : "ml-[20px]"} ${
            isCanvasCompact
              ? getCompactButtonClass(isCanvasOpen)
              : getButtonClass(
                  BUTTON_LAYOUT.canvas,
                  PILL_BUTTON_STYLE,
                  isCanvasOpen,
                )
          }`}
          title="캔버스"
        >
          {isCanvasCompact ? (
            <CanvasIcon className="h-[26px] w-[26px] shrink-0" />
          ) : (
            <span className="whitespace-nowrap">캔버스</span>
          )}
        </ToolButton>

        {/* 도구 버튼 */}
        <ToolButton
          ref={toolTriggerRef}
          as="div"
          className={`${isToolCompact ? "ml-[8px]" : "ml-[20px]"} ${
            isToolCompact
              ? isActiveTool
                ? `${BUTTON_LAYOUT.compact} flex items-center justify-center ${TOOL_BUTTON_STYLE.selected} relative overflow-visible transition-colors duration-200`
                : `${getCompactButtonClass(false)} relative overflow-visible`
              : `${getToolButtonClass(isActiveTool)} group relative overflow-visible`
          }`}
          onMouseLeave={closeMenu}
          onClick={openMenu}
          title="도구"
        >
          {isToolCompact ? (
            <ToolIcon className="h-[26px] w-[26px] shrink-0" />
          ) : (
            <>
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
            </>
          )}

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
