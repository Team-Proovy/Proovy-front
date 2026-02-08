import { ChevronDown } from "lucide-react";
import { ChatInput } from "../features/editor/components/ChatInput";
import { useHomeSend } from "./hooks/useHomeSend";
import { useViewerFile } from "./hooks/useViewerFile";
import { ViewerUploadCard } from "./components/ViewerUploadCard";
import { ErrorBanner } from "./components/ErrorBanner";

/**
 * HomePage - 새 노트 시작점
 *
 * URL: /app/home
 * 레이아웃: AppLayout (Outlet)에서 렌더링됨
 *
 * 기능:
 * - 파일 업로드 또는 텍스트 입력으로 새 노트 생성
 * - 첫 메시지 전송 시 노트 자동 생성 → /app/chat/:chatId 로 이동
 * - 뷰어 파일은 로컬 미리보기만 표시, 노트 생성 후에 업로드
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
      <div className="flex flex-1 flex-col items-center justify-center px-5 pt-[100px]">
        <div className="flex w-fit flex-col">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
              파일을 업로드하고 완벽한 해설을,
            </h1>
          </div>

          {/* 메인 입력 카드 */}
          <div className="mb-10 flex gap-6">
            <ViewerUploadCard
              pdfUrl={pdfUrl}
              fileName={fileName}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onOpenExplorer={openFileExplorer}
              onRemove={handleRemove}
            />

            <ChatInput
              onSend={handleSend}
              isSending={isSending}
            />
          </div>

          {/* 예시 섹션 */}
          <div className="space-y-4">
            <p className="text-[18px] font-semibold text-[#6B6B6B]">
              또는 다음 예시로 시작해 보세요.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 스크롤 안내 */}
      <div className="flex w-full flex-col items-center justify-center pb-8 text-[#666666]">
        <p className="mb-2 text-[18px] font-semibold">
          내려서 다양한 예시 확인하기
        </p>
        <ChevronDown size={50} />
      </div>
    </div>
  );
};
