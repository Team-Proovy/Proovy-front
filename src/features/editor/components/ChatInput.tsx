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

// Assets API
import { useAssetUpload } from "../../assets/hooks/useAssetUpload";
import { createNote } from "../../notes/api/notes_api";
import { useNavigate } from "react-router-dom";

// Lazy load CanvasOverlay (tldraw is heavy - ~2MB)
const CanvasOverlay = lazy(() =>
  import("./canvas/CanvasOverlay").then((m) => ({ default: m.CanvasOverlay })),
);

interface ChatInputProps {
  className?: string; // Additional classes
  style?: React.CSSProperties; // Inline style overrides (Optional fallback)
  /** 뷰어 영역의 ref (뷰어가 있는 페이지에서 전달) */
  viewerRef?: React.RefObject<HTMLElement | null>;
  selectedFile?: File | null; // 선택된 파일
  onUploadSuccess?: () => void; // 파일 업로드 성공 시 호출
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
  selectedFile,
  onUploadSuccess,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { uploadAsset, isUploading } = useAssetUpload();

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
  const handleSend = async () => {
    // text 내용 추출
    const content = inputRef.current?.textContent?.trim() || "";
    if (!content && !selectedFile) return;

    try {
      let assetId: number | undefined;

      // 1. 파일이 있으면 먼저 업로드
      // 기존 HomePage 로직 참고: Note ID가 필요하므로 임시 ID(0) 사용
      // 백엔드에서 0을 허용하거나, 추후 createNote에서 연결되는 구조로 가정
      const TEMP_NOTE_ID = 0;

      if (selectedFile) {
        const assetInfo = await uploadAsset(TEMP_NOTE_ID, selectedFile);
        assetId = assetInfo.assetId;
      }

      // 2. 노트 생성 api 호출
      // firstMessage는 필수, mentionedAssetIds에 업로드된 자산 ID 포함
      const response = await createNote({
        firstMessage: content,
        mentionedAssetIds: assetId ? [assetId] : [],
      });

      if (response.isSuccess) {
        // 3. 노트 생성 성공 시 채팅 페이지로 이동
        // /app/chat/:noteId 경로로 이동
        navigate(`/app/chat/${response.result.noteId}`);
      } else {
        console.error("노트 생성 실패:", response.message);
      }
    } catch (error) {
      console.error("전송 중 오류 발생:", error);
    }
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
