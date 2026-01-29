import { useState, useCallback, useEffect } from "react";

interface UseChatContentOptions {
  inputRef: React.RefObject<HTMLDivElement | null>;
}

interface UseChatContentReturn {
  hasContent: boolean;
  setHasContent: (has: boolean) => void;
  insertHtmlAtCursor: (html: string) => void;
  insertMathField: (initialCmd?: any) => void;
  handleMathFieldBackspace: (e: React.KeyboardEvent) => boolean;
  handleDollarKey: (e: React.KeyboardEvent) => void;
}

/**
 * 채팅 입력 콘텐츠 관리 훅
 * - HTML/Math 필드 삽입
 * - 콘텐츠 상태 관리 (비어있는지 여부)
 * - Math 필드 삭제 처리
 */
export const useChatContent = ({
  inputRef,
}: UseChatContentOptions): UseChatContentReturn => {
  const [hasContent, setHasContent] = useState(false);

  const insertHtmlAtCursor = useCallback(
    (html: string) => {
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
    },
    [inputRef],
  );

  // Revised insertMathField with unique ID for focus
  const insertMathField = useCallback(
    (initialCmd?: any) => {
      const uniqueId = `mf-${Date.now()}`;
      const styleId = `style-${uniqueId}`;
      const btnId = `btn-${uniqueId}`;

      // Wraps the math-field in a span with contenteditable="false" to isolate it from the parent editor.
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
              btn.addEventListener("click", (e: any) => {
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
    },
    [inputRef, insertHtmlAtCursor],
  );

  // Listen for virtual keyboard commands when text area is focused
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
  }, [inputRef, insertMathField]);

  /**
   * Math 필드 Backspace 처리
   * @returns true if event was handled
   */
  const handleMathFieldBackspace = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (e.key !== "Backspace") return false;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;

      const range = sel.getRangeAt(0);

      const deleteNode = (node: Node): boolean => {
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
            if (prev && deleteNode(prev)) return true;
          }
        } else if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
          // Start container is the div. Cursor is at index startOffset.
          // Node before cursor is childNodes[startOffset - 1]
          if (range.startOffset > 0) {
            const prev = range.startContainer.childNodes[range.startOffset - 1];
            if (prev && deleteNode(prev)) return true;
          }
        }
      }

      return false;
    },
    [inputRef],
  );

  /**
   * $ 키 입력 시 Math 필드 삽입
   */
  const handleDollarKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "$") {
        e.preventDefault();
        insertMathField();
      }
    },
    [insertMathField],
  );

  return {
    hasContent,
    setHasContent,
    insertHtmlAtCursor,
    insertMathField,
    handleMathFieldBackspace,
    handleDollarKey,
  };
};
