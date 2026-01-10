import { useRef, useState } from "react";
import "mathlive";

import { ChatInputArea } from "./input/ChatInputArea";
import { MathLayer } from "./layer/MathLayer";
import { InputToolbar } from "./toolbar/InputToolbar";

interface MathChatInputProps {
  className?: string;
}

export const MathChatInput = ({ className }: MathChatInputProps) => {
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [mathValue, setMathValue] = useState("");
  const [editingNode, setEditingNode] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // 수식 입력기 토글 (버튼용) - 새 입력 모드
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

  // 수식 입력 완료
  const handleMathComplete = () => {
    if (!mathValue.trim()) {
      setIsMathOpen(false);
      setEditingNode(null);
      return;
    }

    // 파란색 칩 생성 (math-field를 read-only로 삽입하여 원본 스타일 유지)
    // 투명 오버레이(absolute inset-0)를 씌워서 클릭 이벤트를 확실하게 잡음 (math-field가 가로채지 못하게)
    const chipHtml = `<span class="relative inline-flex items-center justify-center bg-blue-50 px-1 py-0.5 rounded mx-1 select-none align-middle" contenteditable="false" data-latex="${mathValue}">
      <math-field readonly class="text-blue-600 bg-transparent shadow-none border-none outline-none" style="background: transparent; font-size: 1.1em; cursor:text;">${mathValue}</math-field>
      <span class="absolute inset-0 z-10 cursor-pointer"></span>
    </span>&nbsp;`;

    if (editingNode) {
      // 수정 모드: 기존 노드 교체
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
      // 신규 입력 모드: 커서 위치에 삽입
      insertHtmlAtCursor(chipHtml);
    }

    setMathValue("");
    setEditingNode(null);
    setIsMathOpen(false);
  };

  // 입력창 내부 클릭 핸들러 (수정 모드 진입)
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // data-latex 속성이 있는 태그(혹은 그 자식)를 찾음
    const chip = target.closest("[data-latex]");

    if (chip && chip instanceof HTMLElement) {
      const latex = chip.dataset.latex || "";
      setMathValue(latex);
      setEditingNode(chip);
      setIsMathOpen(true);
    }
  };

  // HTML 삽입 헬퍼 함수
  const insertHtmlAtCursor = (html: string) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);

      // 입력창 내부인지 확인
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
        // 포커스가 딴데 있으면 그냥 맨 뒤에 추가
        inputRef.current?.insertAdjacentHTML("beforeend", html);
      }
    } else {
      inputRef.current?.insertAdjacentHTML("beforeend", html);
    }
  };

  return (
    <div className={`relative w-full ${className || "mx-auto max-w-3xl"}`}>
      {/* 1. 수식 입력기 (Floating Layer) */}
      <MathLayer
        isOpen={isMathOpen}
        value={mathValue}
        onInput={setMathValue}
        onClose={() => setIsMathOpen(false)}
        onComplete={handleMathComplete}
      />

      {/* 2. 메인 입력창 UI */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
        {/* 텍스트 에디터 영역 */}
        <ChatInputArea
          ref={inputRef}
          onContentClick={handleContentClick}
          onKeyDown={(e) => {
            if (e.key === "$") {
              e.preventDefault();
              setEditingNode(null);
              setMathValue("");
              setIsMathOpen(true);
            }
          }}
        />

        {/* 툴바 영역 */}
        <InputToolbar
          isMathOpen={isMathOpen}
          onToggleMath={toggleMathEditor}
          onSend={() => console.log("Send clicked")}
        />
      </div>
    </div>
  );
};
