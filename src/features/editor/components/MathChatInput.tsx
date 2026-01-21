import {
  useRef,
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { MathfieldElement } from "mathlive";
import "mathlive";

// Configure MathLive fonts to use local assets (copied to public/fonts)
MathfieldElement.fontsDirectory = "/fonts";
MathfieldElement.soundsDirectory = null;

import { ChatInputArea } from "./input/ChatInputArea";
import { InputToolbar } from "./toolbar/InputToolbar";
import { ToolDropdownMenu, TOOLS } from "./input/ToolDropdownMenu";
import "./math_keyboard.css";

// Lazy load CanvasOverlay (tldraw is heavy - ~2MB)
const CanvasOverlay = lazy(() =>
  import("./canvas/CanvasOverlay").then((m) => ({ default: m.CanvasOverlay })),
);

interface MathChatInputProps {
  className?: string; // Additional classes
  style?: React.CSSProperties; // Inline style overrides (Optional fallback)
  /** 뷰어 영역의 ref (뷰어가 있는 페이지에서 전달) */
  viewerRef?: React.RefObject<HTMLElement | null>;
}

export const MathChatInput = ({
  className = "",
  style,
  viewerRef,
}: MathChatInputProps) => {
  const [isAtMenuOpen, setIsAtMenuOpen] = useState(false);
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [focusedToolIndex, setFocusedToolIndex] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [viewerRect, setViewerRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardContainerRef = useRef<HTMLDivElement>(null);

  // Position the keyboard container relative to the input
  const positionKeyboardContainer = useCallback(() => {
    if (!containerRef.current || !keyboardContainerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const keyboardHeight = 220;

    const kbdContainer = keyboardContainerRef.current;

    // Position horizontally aligned with input
    kbdContainer.style.left = `${rect.left}px`;
    kbdContainer.style.width = "660px";

    if (spaceBelow >= keyboardHeight + 16) {
      // Show below input
      kbdContainer.style.top = `${rect.bottom + 8}px`;
      kbdContainer.style.bottom = "auto";
    } else {
      // Show above input
      kbdContainer.style.top = "auto";
      kbdContainer.style.bottom = `${viewportHeight - rect.top + 8}px`;
    }
  }, []);

  // Setup keyboard container and attach virtual keyboard to it
  useEffect(() => {
    // Create keyboard container if it doesn't exist
    let kbdContainer = document.getElementById(
      "math-keyboard-container",
    ) as HTMLDivElement | null;

    if (!kbdContainer) {
      kbdContainer = document.createElement("div");
      kbdContainer.id = "math-keyboard-container";
      kbdContainer.style.cssText = `
        position: fixed;
        z-index: 9999;
        display: none;
        width: 660px;
      `;
      document.body.appendChild(kbdContainer);
    }

    keyboardContainerRef.current = kbdContainer;

    // Set the container for the virtual keyboard
    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.container = kbdContainer;
    }

    return () => {
      // Hide keyboard when component unmounts (e.g., page navigation)
      if (window.mathVirtualKeyboard?.visible) {
        window.mathVirtualKeyboard.hide();
      }
      // Hide the container as well
      if (kbdContainer) {
        kbdContainer.style.display = "none";
      }
    };
  }, []);

  // Handle keyboard visibility and positioning
  useEffect(() => {
    const handleGeometryChange = () => {
      const kbdContainer = keyboardContainerRef.current;
      if (!kbdContainer) return;

      // Prevent MathLive from adding padding to body
      document.body.style.paddingBottom = "";

      // Update container height based on keyboard height
      if (window.mathVirtualKeyboard?.visible) {
        const height = window.mathVirtualKeyboard.boundingRect.height;
        kbdContainer.style.height = `${height}px`;
        kbdContainer.style.display = "block";
        positionKeyboardContainer();
      }
    };

    const handleKeyboardToggle = () => {
      const kbdContainer = keyboardContainerRef.current;
      if (!kbdContainer) return;

      if (window.mathVirtualKeyboard?.visible) {
        kbdContainer.style.display = "block";
        positionKeyboardContainer();
        setIsMathOpen(true);
      } else {
        kbdContainer.style.display = "none";
        setIsMathOpen(false);
      }
    };

    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.addEventListener(
        "geometrychange",
        handleGeometryChange,
      );
      window.mathVirtualKeyboard.addEventListener(
        "virtual-keyboard-toggle",
        handleKeyboardToggle,
      );
    }

    // Update keyboard position on scroll and resize
    const handleScrollOrResize = () => {
      if (window.mathVirtualKeyboard?.visible) {
        positionKeyboardContainer();
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.removeEventListener(
          "geometrychange",
          handleGeometryChange,
        );
        window.mathVirtualKeyboard.removeEventListener(
          "virtual-keyboard-toggle",
          handleKeyboardToggle,
        );
      }
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [positionKeyboardContainer]);

  const insertHtmlAtCursor = (html: string) => {
    // ... existing logic ...
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

  // Revised insertMathField with unique ID for focus
  const insertMathField = (initialCmd?: any) => {
    const uniqueId = `mf-${Date.now()}`;
    const styleId = `style-${uniqueId}`;
    const btnId = `btn-${uniqueId}`;

    // Wraps the math-field in a span with contenteditable="false" to isolate it from the parent editor.
    // Also adds onkeydown listener to stop propagation so the parent editor doesn't intercept keys.
    const mathFieldHtml = `<style id="${styleId}">#${uniqueId}::part(virtual-keyboard-toggle){display:none}#${uniqueId}::part(menu-toggle){display:none}#${btnId}:hover{background:#eee;color:#333;}</style><span contenteditable="false" class="math-field-wrapper" style="display:inline-flex;align-items:center;vertical-align:middle;line-height:0;margin:0 2px;position:relative;padding-right:20px;"><math-field id="${uniqueId}" math-virtual-keyboard-policy="manual" menu-items="none" style="display:inline-block;min-width:20px;width:auto;padding:2px 4px;border-radius:4px;border:1px solid #ddd;background-color:white;font-size:16px;line-height:normal;color:black;cursor:text;box-shadow:none;margin:0;" onkeydown="event.stopPropagation()"></math-field><button id="${btnId}" style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:16px;height:16px;display:flex;align-items:center;justify-content:center;background:#ccc;color:white;border:none;border-radius:50%;font-size:10px;cursor:pointer;line-height:1;margin-left:4px;" contenteditable="false">✕</button></span>&nbsp;`;

    if (
      document.activeElement !== inputRef.current &&
      !inputRef.current?.contains(document.activeElement)
    ) {
      inputRef.current?.focus();
    }

    insertHtmlAtCursor(mathFieldHtml);

    setTimeout(() => {
      const mf = document.getElementById(uniqueId) as any;
      if (mf) {
        mf.menuItems = [];
        mf.focus();

        // Execute initial command if provided (late binding)
        if (initialCmd) {
          mf.executeCommand(initialCmd);
        }

        if (window.mathVirtualKeyboard) {
          window.mathVirtualKeyboard.show();
        }

        // Ensure the wrapper doesn't trap selection
        const wrapper = mf.parentElement;
        if (wrapper) {
          wrapper.addEventListener("click", (e: MouseEvent) => {
            mf.focus();
            e.stopPropagation();
          });

          // Handle delete button
          const btn = document.getElementById(btnId);
          if (btn) {
            btn.addEventListener("click", (e) => {
              e.stopPropagation(); // prevent focus on math field
              e.preventDefault();

              // style 태그도 함께 제거
              const styleEl = document.getElementById(styleId);
              if (styleEl) {
                styleEl.remove();
              }

              // wrapper 뒤의 &nbsp; 제거
              if (
                wrapper.nextSibling &&
                wrapper.nextSibling.nodeType === Node.TEXT_NODE &&
                wrapper.nextSibling.textContent === "\u00A0"
              ) {
                wrapper.nextSibling.remove();
              }
              wrapper.remove();

              // 삭제 후 콘텐츠 상태 즉시 업데이트
              setTimeout(() => {
                if (inputRef.current) {
                  // 남은 텍스트가 공백만 있는지 확인
                  const remainingText =
                    inputRef.current.textContent?.trim() || "";
                  const remainingHtml = inputRef.current.innerHTML.trim();

                  // 완전히 비었거나 <br>만 남았으면 정리
                  if (
                    remainingText === "" ||
                    remainingHtml === "<br>" ||
                    remainingHtml === ""
                  ) {
                    inputRef.current.innerHTML = "";
                    setHasContent(false);
                  } else {
                    setHasContent(remainingText.length > 0);
                  }
                }
              }, 0);

              inputRef.current?.focus();
            });
          }
        }
      }
    }, 10);
  };

  // Toggle Math keyboard visibility only
  const handleMathToggle = () => {
    if (window.mathVirtualKeyboard) {
      if (window.mathVirtualKeyboard.visible) {
        window.mathVirtualKeyboard.hide();
      } else {
        // Focus on input area first so keyboard input works immediately
        inputRef.current?.focus();
        window.mathVirtualKeyboard.show();
      }
    }
  };

  // Toggle Canvas overlay
  const handleCanvasToggle = () => {
    if (isCanvasOpen) {
      setIsCanvasOpen(false);
      setViewerRect(null);
    } else {
      // 뷰어 영역이 있으면 그 위치 계산
      if (viewerRef?.current) {
        const rect = viewerRef.current.getBoundingClientRect();
        setViewerRect(rect);
      }
      setIsCanvasOpen(true);
    }
  };

  // 캔버스에서 캡처한 이미지를 채팅 입력창에 삽입
  const insertCanvasImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Canvas drawing";
    img.style.cssText =
      "max-width: 200px; max-height: 150px; border-radius: 8px; margin: 4px 0;";

    // 현재 커서 위치에 삽입
    if (inputRef.current) {
      inputRef.current.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        // 커서를 이미지 뒤로 이동
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        inputRef.current.appendChild(img);
      }
    }

    setIsCanvasOpen(false);
    setViewerRect(null);
  };

  // 3. Listen for virtual keyboard commands when text area is focused
  // This enables "Type to insert" behavior when the keyboard is open but no math field is focused.
  useEffect(() => {
    const handleCommand = (ev: Event) => {
      // Check if the selection is within the chat input area
      const sel = window.getSelection();
      let isSelectionInInput = false;

      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (
          inputRef.current &&
          inputRef.current.contains(range.commonAncestorContainer)
        ) {
          isSelectionInInput = true;
        }
      }

      // Also allow if active element is the input (fallback)
      if (document.activeElement === inputRef.current) {
        isSelectionInInput = true;
      }

      if (isSelectionInInput) {
        // Check if active element is NOT a math field (it shouldn't be anyway due to focus loss, but safe check)
        // Note: When clicking the toolbar button, activeElement might be the button, but selection is still in input.
        // We only want to avoid this if the user is ACTUALLY editing a math field.
        const activeEl = document.activeElement as HTMLElement;
        const isEditingMath = activeEl?.tagName.toLowerCase() === "math-field";

        if (!isEditingMath) {
          const detail = (ev as any).detail;
          if (detail) {
            insertMathField(detail);
          }
        }
      }
    };

    if (window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.addEventListener(
        "math-virtual-keyboard-command",
        handleCommand,
      );
    }

    return () => {
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.removeEventListener(
          "math-virtual-keyboard-command",
          handleCommand,
        );
      }
    };
  }, []);

  const handleToolSelect = (toolName: string, isFromMenu: boolean = false) => {
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

  // Fixed Style classes based on Figma design (previously 'homeClasses')
  // W: 660px, Min-H: 160px, Border, Shadow etc.
  const fixedClasses =
    "w-[660px] min-h-[160px] shrink-0 rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-[rgba(255,255,255,0.40)] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] flex flex-col gap-[10px] p-[20px] relative";

  return (
    <div
      ref={containerRef}
      className={`${fixedClasses} ${className}`}
      style={style}
    >
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
        className="flex-1"
        onContentClick={() => {}}
        onContentChange={setHasContent}
        onSubmit={() => {
          if (hasContent) {
            console.log("Send clicked");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "$") {
            e.preventDefault();
            insertMathField();
          }

          if (e.key === "Backspace") {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);

              const deleteNode = (node: Node) => {
                if (
                  node instanceof HTMLElement &&
                  node.classList.contains("math-field-wrapper")
                ) {
                  e.preventDefault();
                  // 인접한 nbsp도 함께 삭제
                  if (
                    node.nextSibling &&
                    node.nextSibling.nodeType === Node.TEXT_NODE &&
                    node.nextSibling.textContent === "\u00A0"
                  ) {
                    node.nextSibling.remove();
                  }
                  node.remove();
                  // 삭제 후 콘텐츠 상태 즉시 업데이트
                  setTimeout(() => {
                    const text = inputRef.current?.textContent?.trim() || "";
                    setHasContent(text.length > 0);
                    // innerHTML이 비었거나 <br>만 있으면 정리
                    if (
                      inputRef.current?.innerHTML === "<br>" ||
                      inputRef.current?.innerHTML === ""
                    ) {
                      inputRef.current.innerHTML = "";
                    }
                  }, 0);
                  return true;
                }
                return false;
              };

              if (range.collapsed) {
                // Check if we are just after a math field
                if (range.startContainer.nodeType === Node.TEXT_NODE) {
                  if (range.startOffset === 0) {
                    // At start of text node, check previous sibling of text node
                    const prev = range.startContainer.previousSibling;
                    if (prev && deleteNode(prev)) return;
                  } else if (
                    range.startOffset === 1 &&
                    range.startContainer.textContent?.charCodeAt(0) === 160
                  ) {
                    // If we are after the &nbsp; (char code 160), delete the wrapper before it?
                    // Actually backspace usually deletes the char before caret.
                    // If that char is nbsp, it deletes nbsp.
                    // The user wants to delete the box.
                    // If the text node is JUST the nbsp, then previousSibling is the wrapper.
                    // Let's rely on standard behavior for nbsp deletion.
                    // But if user clicks 'backspace' and nothing happens (because it's blocked), we force it.
                  }
                } else if (
                  range.startContainer.nodeType === Node.ELEMENT_NODE
                ) {
                  // Start container is the div. Cursor is at index startOffset.
                  // Node before cursor is childNodes[startOffset - 1]
                  if (range.startOffset > 0) {
                    const prev =
                      range.startContainer.childNodes[range.startOffset - 1];
                    if (prev && deleteNode(prev)) return;
                  }
                }
              }
            }
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
        isMathOpen={isMathOpen}
        onToggleMath={handleMathToggle}
        isCanvasOpen={isCanvasOpen}
        onToggleCanvas={handleCanvasToggle}
        onSend={() => console.log("Send clicked")}
        onToolSelect={(tool) => handleToolSelect(tool, false)}
        activeToolName={selectedTool}
        hasContent={hasContent}
      />

      {/* Canvas Overlay - Lazy loaded */}
      {isCanvasOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/80">
              로딩 중...
            </div>
          }
        >
          <CanvasOverlay
            isOpen={isCanvasOpen}
            viewerRect={viewerRect}
            onClose={() => {
              setIsCanvasOpen(false);
              setViewerRect(null);
            }}
            onAdd={insertCanvasImage}
          />
        </Suspense>
      )}
    </div>
  );
};
