import { useState, useCallback } from "react";
import { TOOLS } from "../components/input/ToolDropdownMenu";

interface UseAtMenuOptions {
  inputRef: React.RefObject<HTMLDivElement | null>;
}

interface UseAtMenuReturn {
  isAtMenuOpen: boolean;
  setIsAtMenuOpen: (open: boolean) => void;
  menuPos: { top: number; left: number };
  focusedToolIndex: number;
  setFocusedToolIndex: (index: number) => void;
  selectedTool: string | null;
  updateMenuPosition: () => void;
  handleToolSelect: (toolName: string, isFromMenu?: boolean) => void;
  handleAtMenuKeyDown: (e: React.KeyboardEvent) => boolean;
}

/**
 * @ 메뉴 상태 관리 훅
 * - 메뉴 열기/닫기
 * - 위치 계산
 * - 키보드 네비게이션 (Arrow Up/Down, Enter, Escape)
 */
export const useAtMenu = ({ inputRef }: UseAtMenuOptions): UseAtMenuReturn => {
  const [isAtMenuOpen, setIsAtMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [focusedToolIndex, setFocusedToolIndex] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const updateMenuPosition = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const container = inputRef.current?.parentElement;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const top = rect.top === 0 ? containerRect.top + 20 : rect.top;
        const left = rect.left === 0 ? containerRect.left + 20 : rect.left;

        setMenuPos({
          top: top - containerRect.top - 160,
          left: left - containerRect.left,
        });
      }
    }
  }, [inputRef]);

  const handleToolSelect = useCallback(
    (toolName: string, isFromMenu: boolean = false) => {
      setSelectedTool(toolName);
      if (isFromMenu) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const textNode = range.startContainer;
            const text = textNode.textContent || "";
            const offset = range.startOffset;
            if (offset > 0 && text[offset - 1] === "@") {
              range.setStart(textNode, offset - 1);
              range.setEnd(textNode, offset);
              range.deleteContents();
            }
          }
        }
      }
    },
    [],
  );

  /**
   * @ 메뉴 관련 키보드 이벤트 처리
   * @returns true if event was handled, false otherwise
   */
  const handleAtMenuKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isAtMenuOpen) {
        // @ 키 입력 시 메뉴 열기
        if (e.key === "@") {
          setTimeout(() => {
            updateMenuPosition();
            setIsAtMenuOpen(true);
            setFocusedToolIndex(0);
          }, 0);
          return false; // 문자 입력은 허용
        }
        return false;
      }

      // 메뉴가 열려있을 때
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedToolIndex((prev) => (prev + 1) % TOOLS.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedToolIndex((prev) => (prev - 1 + TOOLS.length) % TOOLS.length);
        return true;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleToolSelect(TOOLS[focusedToolIndex], true);
        setIsAtMenuOpen(false);
        return true;
      }
      if (e.key === "Escape") {
        setIsAtMenuOpen(false);
        return true;
      }
      if (e.key === "Backspace") {
        setIsAtMenuOpen(false);
        return false; // Backspace는 계속 처리되어야 함
      }

      return false;
    },
    [isAtMenuOpen, focusedToolIndex, handleToolSelect, updateMenuPosition],
  );

  return {
    isAtMenuOpen,
    setIsAtMenuOpen,
    menuPos,
    focusedToolIndex,
    setFocusedToolIndex,
    selectedTool,
    updateMenuPosition,
    handleToolSelect,
    handleAtMenuKeyDown,
  };
};
