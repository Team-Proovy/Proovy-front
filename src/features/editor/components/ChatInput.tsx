import { useRef, lazy, Suspense, useState, useEffect } from "react";
import { MathfieldElement } from "mathlive";
import "mathlive";
import { showErrorToast } from "@/shared/lib/toast";

// Configure MathLive fonts to use local assets (copied to public/fonts)
MathfieldElement.fontsDirectory = "/fonts";
MathfieldElement.soundsDirectory = null;

import { ChatInputArea } from "./input/ChatInputArea";
import { InputToolbar } from "./toolbar/InputToolbar";
import type { StopControl } from "./toolbar/InputToolbar";
import { ToolDropdownMenu } from "./input/ToolDropdownMenu";
import { FileDropdownMenu } from "./input/FileDropdownMenu";
import { AttachmentPreview } from "./input/AttachmentPreview";
import { DragDropOverlay } from "./input/DragDropOverlay";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { FILE_ACCEPT } from "@/features/assets/utils/fileValidation";
import { extractInputContent } from "../utils/extract_input_content";
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

// Lazy load CanvasOverlay (canvas libraries are relatively heavy)
const CanvasOverlay = lazy(() =>
  import("./canvas/CanvasOverlay").then((m) => ({ default: m.CanvasOverlay })),
);

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
  onSend?: (data: ChatSendData) => void | boolean | Promise<void | boolean>;
  /** 전송 중 여부 (true이면 전송 버튼 비활성화) */
  isSending?: boolean;
  /**
   * 대화 run 상태. Active Run 동안 입력은 draft로만 쓰고(Enter·전송 없음) 전송 대신 정지 버튼을 보인다.
   * CANCELING이면 "중단 중"을 보인다. terminal 뒤에는 사용자가 직접 보낼 때만 보낸다.
   */
  runControl?: ChatInputRunControl;
  /** 요청 한도(Retry-After) 대기 등으로 지금은 보내지 않는다 */
  isSendBlocked?: boolean;
  /** 입력창에 되돌릴 질문(Server가 받지 않은 draft 등). `id`가 바뀔 때마다 입력창 내용을 이 text로 바꾼다. */
  draftRestore?: { id: number; text: string } | null;
}

export interface ChatInputRunControl extends Omit<StopControl, "isCanceling"> {
  phase: "idle" | "active" | "canceling";
  /** Active Run 동안 입력창 아래 안내 */
  activeHint: string;
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
  runControl,
  isSendBlocked = false,
  draftRestore,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isRunBusy = !!runControl && runControl.phase !== "idle";

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

  // 전송 핸들러. 크레딧 차감은 Server 접수가 맡는다(Front 직접 차감 없음).
  const handleSend = async () => {
    if (isSending || isProcessing) return;
    // Active Run·중단 중에는 draft만 쓴다. 요청 한도 대기 중에도 보내지 않는다.
    if (isRunBusy || isSendBlocked) return;
    if (!hasContent) return;

    // DOM에서 콘텐츠 추출 (텍스트 + LaTeX + 멘션)
    const extracted = inputRef.current
      ? extractInputContent(inputRef.current)
      : { text: "", latex: undefined, mentionedAssetIds: [] as number[] };

    if (!extracted.text.trim()) return;

    setIsProcessing(true);

    const mentionedToolCodes = selectedToolCode ? [selectedToolCode] : [];
    const sendPayload: ChatSendData = {
      message: extracted.text,
      latex: extracted.latex,
      mentionedAssetIds: extracted.mentionedAssetIds,
      mentionedToolCodes,
      attachments: [...attachments],
    };

    try {
      // false면 보내지 않은 것이다(접수 거부·검사 실패 등): 입력창을 그대로 둔다.
      const sent = await onSend?.(sendPayload);
      if (sent === false) return;
      if (inputRef.current) {
        inputRef.current.innerHTML = "";
      }
      setHasContent(false);
      clearMentionedAssets();
      clearAttachments();
      handleToolSelect(""); // 선택된 도구 초기화
    } catch (error) {
      console.error("Send failed:", error);
      showErrorToast(
        "메시지 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Server가 받지 않은 질문을 입력창으로 되돌린다(자동 재전송 없음). 수식은 `$…$` 텍스트로 돌아온다.
  // 그 사이 써 둔 draft는 지우지 않는다: 되돌린 질문을 앞에 붙이고 기존 내용(수식 field 포함)은 그대로 둔다.
  const restoreId = draftRestore?.id;
  const restoreText = draftRestore?.text;
  useEffect(() => {
    if (restoreId === undefined || restoreText === undefined) return;
    const input = inputRef.current;
    if (!input) return;
    const current = input.textContent?.trim() ?? "";
    if (!current) input.textContent = restoreText;
    else if (!current.startsWith(restoreText.trim())) {
      // 줄은 `<br>`로 나눈다(text node의 `\n`은 접힐 수 있다). 추출은 `<br>`을 줄바꿈으로 읽는다.
      const first = input.firstChild;
      input.insertBefore(document.createTextNode(restoreText), first);
      input.insertBefore(document.createElement("br"), first);
    }
    setHasContent(input.textContent?.trim().length !== 0);
  }, [restoreId, restoreText, setHasContent]);

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
      {isDragOver && <DragDropOverlay />}
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* @ 도구 메뉴 드롭다운 (fixed: overflow-hidden 부모에 잘리지 않도록) */}
      {isAtMenuOpen && (
        <div
          style={{
            position: "fixed",
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

      {/* # 파일 멘션 메뉴 드롭다운 (fixed: overflow-hidden 부모에 잘리지 않도록) */}
      {isFileMenuOpen && (
        <div
          style={{
            position: "fixed",
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
        hasContent={hasContent && !isSendBlocked}
        onClipClick={openFilePicker}
        isSending={isSending || isProcessing}
        stopControl={
          runControl && isRunBusy
            ? {
                canStop: runControl.canStop,
                isCanceling: runControl.phase === "canceling",
                onStop: runControl.onStop,
                label: runControl.label,
                cancelingText: runControl.cancelingText,
              }
            : undefined
        }
      />
      {isRunBusy && (
        <p className="w-full text-[12px] leading-[18px] text-[#6B7280]">
          {runControl.activeHint}
        </p>
      )}

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
