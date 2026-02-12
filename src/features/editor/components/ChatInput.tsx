import { useRef, lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useUseCredit } from "../../settings/hooks/useCredit";

// Constants
import { CHAT_INPUT_CLASSES } from "../constants/chat_input";

// Lazy load CanvasOverlay (tldraw is heavy - ~2MB)
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
  const navigate = useNavigate();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // 크레딧 사용 뮤테이션
  const { mutateAsync: deductCredit } = useUseCredit();

  // 전송 핸들러
  const handleSend = async () => {
    if (isSending || isProcessing) return;
    if (!hasContent && attachments.length === 0) return;

    setIsProcessing(true);

    // DOM에서 콘텐츠 추출 (텍스트 + LaTeX + 멘션)
    const extracted = inputRef.current
      ? extractInputContent(inputRef.current)
      : { text: "", latex: undefined, mentionedAssetIds: [] as number[] };

    if (!extracted.text && attachments.length === 0) return;

    // 크레딧 차감 시도
    try {
      const creditResponse = await deductCredit({
        eventType: "LLM_QUERY",
        difficulty: "medium", // 기본값 설정 (필요시 prop으로 전달받도록 수정 가능)
        featureName: "Chat",
        description: "AI 채팅 질문",
      });

      if (!creditResponse.result.success) {
        setShowCreditModal(true);
        setIsProcessing(false);
        return;
      }
    } catch (error) {
      console.error("Credit deduction failed:", error);
      alert("크레딧 차감 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsProcessing(false);
      return;
    }

    try {
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
    } finally {
      setIsProcessing(false);
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
      {/* 크레딧 부족 안내 모달 */}
      {showCreditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCreditModal(false)}
        >
          <div
            className="flex w-[400px] flex-col items-center rounded-[20px] bg-white p-[30px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-[20px] font-['Pretendard'] text-[20px] font-bold text-black">
              크레딧 부족
            </h2>
            <p className="mb-[30px] text-center font-['Pretendard'] text-[16px] leading-[24px] text-[#5D6470]">
              현재 사용할 수 있는 크레딧이 없습니다.
              <br />
              업그레이드 하시겠습니까?
            </p>
            <div className="flex w-full gap-[10px]">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#F1F4F8] py-[14px] font-['Pretendard'] text-[16px] font-semibold text-[#6B7280] transition-colors hover:bg-[#E5E8EC]"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  navigate("/pricing");
                }}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#2A6AFF] py-[14px] font-['Pretendard'] text-[16px] font-semibold text-white transition-colors hover:bg-[#1A50D1]"
              >
                업그레이드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
