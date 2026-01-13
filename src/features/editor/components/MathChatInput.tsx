import { useRef, useState } from "react";
import "mathlive";

import { ChatInputArea } from "./input/ChatInputArea";
import { MathLayer } from "./layer/MathLayer";
import { InputToolbar } from "./toolbar/InputToolbar";
import { ToolDropdownMenu, TOOLS } from "./input/ToolDropdownMenu";

interface MathChatInputProps {
  className?: string; // Additional classes
  style?: React.CSSProperties; // Inline style overrides (Optional fallback)
  variant?: "home" | "chat";
}

export const MathChatInput = ({
  className = "",
  style,
  variant = "home",
}: MathChatInputProps) => {
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [mathValue, setMathValue] = useState("");
  const [editingNode, setEditingNode] = useState<HTMLElement | null>(null);
  const [isAtMenuOpen, setIsAtMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [focusedToolIndex, setFocusedToolIndex] = useState<number>(0);
  const inputRef = useRef<HTMLDivElement>(null);

  const toggleMathEditor = () => {
    if (isMathOpen) {
      setIsMathOpen(false);
      setEditingNode(null);
      setMathValue("");
    } else {
      setEditingNode(null);
      setMathValue("");
      setIsMathOpen(true);
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);

      if (inputRef.current?.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        inputRef.current?.insertAdjacentHTML("beforeend", html);
      }
    } else {
      inputRef.current?.insertAdjacentHTML("beforeend", html);
    }
  };

  const handleToolSelect = (toolName: string, isFromMenu: boolean = false) => {
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

    const toolChipHtml = `<span class="inline-flex items-center justify-center bg-[#E5F0FF] text-[#2A6AFF] rounded-[4px] px-[6px] py-[2px] mx-1 text-[15px] font-medium select-none align-middle" contenteditable="false" data-tool="${toolName}">${toolName}</span>&nbsp;`;
    insertHtmlAtCursor(toolChipHtml);
  };

  const handleMathComplete = () => {
    if (!mathValue.trim()) {
      setIsMathOpen(false);
      setEditingNode(null);
      return;
    }

    const chipHtml = `<span class="relative inline-flex items-center justify-center bg-blue-50 px-1 py-0.5 rounded mx-1 select-none align-middle" contenteditable="false" data-latex="${mathValue}">
      <math-field readonly class="text-blue-600 bg-transparent shadow-none border-none outline-none" style="background: transparent; font-size: 1.1em; cursor:text;">${mathValue}</math-field>
      <span class="absolute inset-0 z-10 cursor-pointer"></span>
    </span>&nbsp;`;

    if (editingNode) {
      const range = document.createRange();
      range.selectNode(editingNode);
      range.deleteContents();
      const el = document.createElement("div");
      el.innerHTML = chipHtml;
      const frag = document.createDocumentFragment();
      let node;
      while ((node = el.firstChild)) {
        frag.appendChild(node);
      }
      range.insertNode(frag);
    } else {
      insertHtmlAtCursor(chipHtml);
    }

    setMathValue("");
    setEditingNode(null);
    setIsMathOpen(false);
  };

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const chip = target.closest("[data-latex]");

    if (chip && chip instanceof HTMLElement) {
      const latex = chip.dataset.latex || "";
      setMathValue(latex);
      setEditingNode(chip);
      setIsMathOpen(true);
    }
  };

  const updateMenuPosition = () => {
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
  };

  // Variant Classes (Tailwind)
  const isHome = variant === "home";

  // Home: 952x176, Shadow, etc. (Use min-h to allow expansion)
  // CHANGED: justify-between -> gap-[20px] and added flex-grow logic to input
  const homeClasses =
    "w-[952px] min-h-[176px] shrink-0 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-[rgba(255,255,255,0.40)] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] flex flex-col gap-[20px] p-[20px] relative mx-auto";

  // Chat: 880x119, Compact, relative (Use min-h to allow expansion)
  const chatClasses =
    "w-[880px] min-h-[119px] p-[12px_20px] gap-[20px] relative rounded-[16px] border-[0.5px] border-[#C6C6C6] bg-[rgba(255,255,255,0.40)] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] flex flex-col";

  const baseClasses = isHome ? homeClasses : chatClasses;

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={style} // Keep style prop for users who explicitly want inline overrides
    >
      <MathLayer
        isOpen={isMathOpen}
        value={mathValue}
        onInput={setMathValue}
        onClose={() => setIsMathOpen(false)}
        onComplete={handleMathComplete}
      />

      {isAtMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 50,
          }}
        >
          <ToolDropdownMenu
            className="!static"
            onSelect={(tool) => {
              handleToolSelect(tool, true);
              setIsAtMenuOpen(false);
            }}
            onClose={() => setIsAtMenuOpen(false)}
            onMouseEnter={() => {}}
            focusedIndex={focusedToolIndex}
            onFocusChange={setFocusedToolIndex}
          />
        </div>
      )}

      <ChatInputArea
        ref={inputRef}
        // CHANGED: Added flex-1 to always fill the available vertical space, pushing toolbar to bottom
        className={`flex-1 ${!isHome ? "!min-h-[36px]" : ""}`}
        onContentClick={handleContentClick}
        onKeyDown={(e) => {
          if (e.key === "$") {
            e.preventDefault();
            setEditingNode(null);
            setMathValue("");
            setIsMathOpen(true);
          }
          if (isAtMenuOpen) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setFocusedToolIndex((prev) => (prev + 1) % TOOLS.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setFocusedToolIndex(
                (prev) => (prev - 1 + TOOLS.length) % TOOLS.length,
              );
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleToolSelect(TOOLS[focusedToolIndex], true);
              setIsAtMenuOpen(false);
              return;
            }
          }

          if (e.key === "@") {
            setTimeout(() => {
              updateMenuPosition();
              setIsAtMenuOpen(true);
              setFocusedToolIndex(0);
            }, 0);
          }
          if (e.key === "Escape") {
            setIsAtMenuOpen(false);
          }
          if (e.key === "Backspace") {
            if (isAtMenuOpen) {
              setIsAtMenuOpen(false);
            }
          }
        }}
      />

      <InputToolbar
        variant={variant}
        isMathOpen={isMathOpen}
        onToggleMath={toggleMathEditor}
        onSend={() => console.log("Send clicked")}
        onToolSelect={(tool) => handleToolSelect(tool, false)}
      />
    </div>
  );
};
