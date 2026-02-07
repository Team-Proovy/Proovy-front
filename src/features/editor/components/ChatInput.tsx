import { useRef, lazy, Suspense } from "react";
import { MathfieldElement } from "mathlive";
import "mathlive";

// Configure MathLive fonts to use local assets (copied to public/fonts)
MathfieldElement.fontsDirectory = "/fonts";
MathfieldElement.soundsDirectory = null;

import { ChatInputArea } from "./input/ChatInputArea";
import { InputToolbar } from "./toolbar/InputToolbar";
import { ToolDropdownMenu } from "./input/ToolDropdownMenu";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { extractMessageContent } from "../utils/extract_message_content";
import { getToolCode } from "../constants/tool_codes";
import "./math_keyboard.css";

// Hooks
import {
  useMathKeyboard,
  useAtMenu,
  useCanvasOverlay,
  useChatContent,
} from "../hooks";

// Constants
import { CHAT_INPUT_CLASSES } from "../constants/chat_input";

// Lazy load CanvasOverlay (tldraw is heavy - ~2MB)
const CanvasOverlay = lazy(() =>
  import("./canvas/CanvasOverlay").then((m) => ({ default: m.CanvasOverlay })),
);

import type { CreateNoteRequest } from "../../notes/api/notes_types";

/** 노트 생성 시 전송할 페이로드 (첫 메시지) */
export type CreateNotePayload = CreateNoteRequest;

interface ChatInputProps {
  className?: string; // Additional classes
  style?: React.CSSProperties; // Inline style overrides (Optional fallback)
  /** 뷰어 영역의 ref (뷰어가 있는 페이지에서 전달) */
  viewerRef?: React.RefObject<HTMLElement | null>;
  /** 홈화면에서 첫 메시지 전송 시 호출 (노트 생성 API용) */
  onSendWithPayload?: (payload: CreateNotePayload) => void;
  /** 전송 중 여부 (버튼 비활성화용) */
  isSendPending?: boolean;
}

/**
 * ChatInput - 채팅 입력 컴포넌트
 *
 * 기능:
 * - MathLive 수식 입력 ($ 키 또는 툴바 버튼)
 * - @ 메뉴로 도구 선택
 * - 캔버스 오버레이로 그리기
 * - 파일 업로드 (툴바)
 */
export const ChatInput = ({
  className = "",
  style,
  viewerRef,
  onSendWithPayload,
  isSendPending = false,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom Hooks
  const { isMathOpen, handleMathToggle } = useMathKeyboard({
    containerRef,
  });

  const {
    isAtMenuOpen,
    setIsAtMenuOpen,
    menuPos,
    focusedToolIndex,
    setFocusedToolIndex,
    selectedTool,
    handleToolSelect,
    handleAtMenuKeyDown,
  } = useAtMenu({ inputRef });

  const {
    isCanvasOpen,
    viewerRect,
    handleCanvasToggle,
    insertCanvasImage,
    closeCanvas,
  } = useCanvasOverlay({ viewerRef, inputRef });

  const {
    hasContent,
    setHasContent,
    handleMathFieldBackspace,
    handleDollarKey,
  } = useChatContent({ inputRef });

  // 키보드 이벤트 통합 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // $ 키로 수식 필드 삽입
    handleDollarKey(e);

    // Backspace로 math-field 삭제
    if (handleMathFieldBackspace(e)) return;

    // @ 메뉴 키보드 네비게이션
    if (handleAtMenuKeyDown(e)) return;
  };

  // 전송 핸들러
  const handleSend = () => {
    if (!hasContent || isSendPending) return;

    const firstMessage = extractMessageContent(inputRef.current).trim();
    if (!firstMessage) return;

    // 홈화면 노트 생성 모드
    if (onSendWithPayload) {
      const toolCode = getToolCode(selectedTool);
      const mentionedToolCodes = toolCode ? [toolCode] : [];
      onSendWithPayload({
        firstMessage,
        mentionedAssetIds: [],
        mentionedToolCodes,
      });
      return;
    }

    // 채팅방 등 기타 모드 (추후 구현)
    console.log("Send clicked", { firstMessage });
  };

  return (
    <div
      ref={containerRef}
      className={`${CHAT_INPUT_CLASSES} ${className}`}
      style={style}
    >
      {/* @ 메뉴 드롭다운 */}
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

      {/* 입력 영역 */}
      <ChatInputArea
        ref={inputRef}
        className="flex-1"
        onContentClick={() => {}}
        onContentChange={setHasContent}
        onSubmit={handleSend}
        onKeyDown={handleKeyDown}
      />

      {/* 툴바 */}
      <InputToolbar
        isMathOpen={isMathOpen}
        onToggleMath={() => {
          inputRef.current?.focus();
          handleMathToggle();
        }}
        isCanvasOpen={isCanvasOpen}
        onToggleCanvas={handleCanvasToggle}
        onSend={handleSend}
        onToolSelect={(tool) => handleToolSelect(tool, false)}
        activeToolName={selectedTool}
        hasContent={hasContent}
        isSendPending={isSendPending}
      />

      {/* Canvas Overlay - Lazy loaded */}
      {isCanvasOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/80">
              <LoadingSpinner size={50} />
            </div>
          }
        >
          <CanvasOverlay
            isOpen={isCanvasOpen}
            viewerRect={viewerRect}
            onClose={closeCanvas}
            onAdd={insertCanvasImage}
          />
        </Suspense>
      )}
    </div>
  );
};
