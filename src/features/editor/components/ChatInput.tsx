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
import { FILE_ACCEPT } from "@/features/assets/utils/fileValidation";
import "./math_keyboard.css";

// Hooks
import {
  useMathKeyboard,
  useAtMenu,
  useCanvasOverlay,
  useChatContent,
} from "../hooks";
import { useAttachments, type Attachment } from "../hooks/useAttachments";

// Constants
import { CHAT_INPUT_CLASSES } from "../constants/chat_input";

// Lazy load CanvasOverlay (tldraw is heavy - ~2MB)
const CanvasOverlay = lazy(() =>
  import("./canvas/CanvasOverlay").then((m) => ({ default: m.CanvasOverlay })),
);

/**
 * contentEditable DOM에서 텍스트, LaTeX, 멘션된 에셋 ID를 추출
 * - math-field → LaTeX 값 ($...$)
 * - span[data-asset-id] → 에셋 ID 수집
 * - br → 줄바꿈
 */
const extractInputContent = (inputEl: HTMLDivElement) => {
  const parts: string[] = [];
  const latexParts: string[] = [];
  const assetIds = new Set<number>();

  const walk = (node: Node) => {
    // 텍스트 노드
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent || "");
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    const tag = node.tagName.toLowerCase();

    // <style>, <button> 등 무시할 요소
    if (tag === "style" || tag === "button") return;

    // math-field 요소 → LaTeX 추출
    if (tag === "math-field") {
      const latex = (node as any).value || "";
      if (latex) {
        parts.push(`$${latex}$`);
        latexParts.push(latex);
      }
      return;
    }

    // #파일 멘션 span → data-asset-id 수집
    const assetId = node.dataset?.assetId;
    if (assetId) {
      assetIds.add(Number(assetId));
      parts.push(node.textContent || "");
      return;
    }

    // BR → 줄바꿈
    if (tag === "br") {
      parts.push("\n");
      return;
    }

    // 기타 요소 (math-field-wrapper 등) → 자식 순회
    for (const child of node.childNodes) {
      walk(child);
    }
  };

  for (const child of inputEl.childNodes) {
    walk(child);
  }

  return {
    text: parts.join("").trim(),
    latex: latexParts.length > 0 ? latexParts.join("; ") : undefined,
    mentionedAssetIds: Array.from(assetIds),
  };
};

/** onSend 콜백으로 전달되는 메시지 데이터 */
export interface ChatSendData {
  message: string;
  latex?: string;
  mentionedAssetIds: number[];
  mentionedToolCodes: string[];
  /** 첨부 파일 목록 (업로드 전 원본) */
  attachments: Attachment[];
}

interface ChatInputProps {
  className?: string; // Additional classes
  style?: React.CSSProperties; // Inline style overrides (Optional fallback)
  /** 현재 노트 ID (#파일 멘션에 사용) */
  noteId?: number | null;
  /** 메시지 전송 콜백 */
  onSend?: (data: ChatSendData) => void;
  /** 전송 중 여부 (true이면 전송 버튼 비활성화) */
  isSending?: boolean;
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
  noteId,
  onSend,
  isSending = false,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom Hooks
  const {
    attachments,
    addFiles,
    addCanvasImage,
    removeAttachment,
    clearAttachments,
    openFilePicker,
    fileInputRef,
    isDragOver,
    dragHandlers,
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
    selectedToolCode,
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
    clearMentionedAssets,
    isAssetsLoading,
  } = useAtMenu({ inputRef, containerRef, noteId });

  const { isCanvasOpen, handleCanvasToggle, closeCanvas } = useCanvasOverlay();

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
    if (isSending) return;
    if (!hasContent && attachments.length === 0) return;

    // DOM에서 콘텐츠 추출 (텍스트 + LaTeX + 멘션)
    const extracted = inputRef.current
      ? extractInputContent(inputRef.current)
      : { text: "", latex: undefined, mentionedAssetIds: [] as number[] };

    if (!extracted.text && attachments.length === 0) return;

    // 도구 코드 수집
    const mentionedToolCodes = selectedToolCode ? [selectedToolCode] : [];

    // 부모 콜백 호출
    onSend?.({
      message: extracted.text,
      latex: extracted.latex,
      mentionedAssetIds: extracted.mentionedAssetIds,
      mentionedToolCodes,
      attachments: [...attachments],
    });

    // 입력 상태 초기화
    if (inputRef.current) {
      inputRef.current.innerHTML = "";
    }
    setHasContent(false);
    clearMentionedAssets();
    clearAttachments();
    handleToolSelect(""); // 선택된 도구 초기화
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
      {...dragHandlers}
    >
      {/* 드래그 앤 드롭 오버레이 */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-[12px] border-2 border-dashed border-[#2A6AFF] bg-[#2A6AFF]/10 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2A6AFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
              />
            </svg>
            <span className="text-[14px] font-medium text-[#2A6AFF]">
              파일을 여기에 놓으세요
            </span>
          </div>
        </div>
      )}
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
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
        hasContent={!isSending && (hasContent || attachments.length > 0)}
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
            onClose={closeCanvas}
            onAdd={addCanvasImage}
          />
        </Suspense>
      )}
    </div>
  );
};
