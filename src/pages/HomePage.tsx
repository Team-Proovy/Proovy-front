import { ChatInput } from "../features/editor/components/ChatInput";
import { useHomeSend } from "./hooks/useHomeSend";
import { useViewerFile } from "./hooks/useViewerFile";
import { ViewerUploadCard } from "./components/ViewerUploadCard";
import { ErrorBanner } from "./components/ErrorBanner";

/**
 * HomePage - 새 노트 시작점
 */
export const HomePage = () => {
  const { viewerFileRef, isSending, uploadError, clearError, handleSend } =
    useHomeSend();

  const {
    pdfUrl,
    fileName,
    fileInputRef,
    openFileExplorer,
    handleFileChange,
    handleRemove,
    isDragging,
    dragProps,
  } = useViewerFile(viewerFileRef);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* 에러 배너 */}
      {uploadError && (
        <ErrorBanner
          message={uploadError}
          onClose={clearError}
        />
      )}

      {/* 메인 컨텐츠 - 정중앙 배치 */}
      <div className="flex flex-1 flex-col justify-center px-5 pt-[100px]">
        <div className="mx-auto flex w-full max-w-[920px] flex-col">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
              파일을 업로드하고 완벽한 해설을,
            </h1>
          </div>

          {/* 메인 입력 카드 */}
          <div className="mb-10 flex gap-[40px]">
            <ViewerUploadCard
              pdfUrl={pdfUrl}
              fileName={fileName}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onOpenExplorer={openFileExplorer}
              onRemove={handleRemove}
              isDragging={isDragging}
              dragProps={dragProps}
            />

            <ChatInput
              onSend={handleSend}
              isSending={isSending}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
