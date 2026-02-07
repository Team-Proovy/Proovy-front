import { useRef, lazy, Suspense } from "react";
import { MathfieldElement } from "mathlive";
import "mathlive";

// Configure MathLive fonts to use local assets (copied to public/fonts)
MathfieldElement.fontsDirectory = "/fonts";
MathfieldElement.soundsDirectory = null;

import { ChatInputArea } from "./input/ChatInputArea";
import { InputToolbar } from "./toolbar/InputToolbar";
import { ToolDropdownMenu } from "./input/ToolDropdownMenu";
import { FileDropdownMenu } from "./input/FileDropdownMenu";
import { AttachmentPreview } from "./input/AttachmentPreview";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import "./math_keyboard.css";

// Hooks
import {
  useMathKeyboard,
  useAtMenu,
  useCanvasOverlay,
  useChatContent,
} from "../hooks";
import { useAttachments } from "../hooks/useAttachments";

// Constants
import { CHAT_INPUT_CLASSES } from "../constants/chat_input";

// Lazy load CanvasOverlay (tldraw is heavy - ~2MB)
const CanvasOverlay = lazy(() =>
  import("./canvas/CanvasOverlay").then((m) => ({ default: m.CanvasOverlay })),
);

interface ChatInputProps {
  className?: string; // Additional classes
  style?: React.CSSProperties; // Inline style overrides (Optional fallback)
  /** 뷰어 영역의 ref (뷰어가 있는 페이지에서 전달) */
  viewerRef?: React.RefObject<HTMLElement | null>;
  /** 현재 노트 ID (#파일 멘션에 사용) */
  noteId?: number | null;
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
  noteId,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom Hooks
  const {
    attachments,
    addFiles,
    addCanvasImage,
    removeAttachment,
    openFilePicker,
    fileInputRef,
  } = useAttachments();

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
    filteredTools,
    handleToolSelect,
    handleAtMenuKeyDown,

    // # 파일 멘션 메뉴
    isFileMenuOpen,
    setIsFileMenuOpen,
    fileMenuPos,
    focusedFileIndex,
    setFocusedFileIndex,
    filteredAssets,
    handleFileSelect,
    isAssetsLoading,
  } = useAtMenu({ inputRef, containerRef, noteId });

  const { isCanvasOpen, viewerRect, handleCanvasToggle, closeCanvas } =
    useCanvasOverlay({ viewerRef, inputRef });

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
    if (hasContent || attachments.length > 0) {
      console.log("Send clicked");
      // TODO: 실제 전송 로직 구현
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // input value 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = "";
  };

  return (
    <div
      ref={containerRef}
      className={`${CHAT_INPUT_CLASSES} ${className}`}
      style={style}
    >
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* @ 도구 메뉴 드롭다운 */}
      {isAtMenuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: menuPos.bottom,
            left: menuPos.left,
            zIndex: 50,
          }}
        >
          <ToolDropdownMenu
            tools={filteredTools}
            className="!static"
            onSelect={(tool) => {
              handleToolSelect(tool, true);
              setIsAtMenuOpen(false);
            }}
            onClose={() => setIsAtMenuOpen(false)}
            focusedIndex={focusedToolIndex}
            onFocusChange={setFocusedToolIndex}
          />
        </div>
      )}

      {/* # 파일 멘션 메뉴 드롭다운 */}
      {isFileMenuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: fileMenuPos.bottom,
            left: fileMenuPos.left,
            zIndex: 50,
          }}
        >
          <FileDropdownMenu
            assets={filteredAssets}
            className="!static"
            onSelect={handleFileSelect}
            onClose={() => setIsFileMenuOpen(false)}
            focusedIndex={focusedFileIndex}
            onFocusChange={setFocusedFileIndex}
            isLoading={isAssetsLoading}
          />
        </div>
      )}

      {/* 첨부 파일 프리뷰 영역 */}
      <AttachmentPreview
        attachments={attachments}
        onRemove={removeAttachment}
      />

      {/* 입력 영역 (남은 공간을 채우며 내부 스크롤) */}
      <ChatInputArea
        ref={inputRef}
        className="min-h-0 flex-1"
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
        hasContent={hasContent || attachments.length > 0}
        onClipClick={openFilePicker}
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
            onAdd={addCanvasImage}
          />
        </Suspense>
      )}
    </div>
  );
};
