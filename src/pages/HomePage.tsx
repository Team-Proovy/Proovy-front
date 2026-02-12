import { ChevronDown } from "lucide-react";
import { ChatInput } from "../features/editor/components/ChatInput";
import { useHomeSend } from "./hooks/useHomeSend";
import { useViewerFile } from "./hooks/useViewerFile";
import { ViewerUploadCard } from "./components/ViewerUploadCard";
import { ErrorBanner } from "./components/ErrorBanner";
import { FeatureSection } from "../features/landing/components/FeatureSection";
import { FeatureGrid } from "../features/landing/components/FeatureGrid";
import { CTASection } from "../features/landing/components/CTASection";
import { FAQSection } from "../features/landing/components/FAQSection";

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

  const scrollToMore = () => {
    const introElement = document.getElementById("intro-homescreen");
    if (introElement) {
      introElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-white">
      {/* 에러 배너 */}
      {uploadError && (
        <ErrorBanner
          message={uploadError}
          onClose={clearError}
        />
      )}

      {/* 메인 홈 화면 - 한 화면을 꽉 채우는 구성 */}
      <div className="flex min-h-screen flex-col items-center">
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

        {/* 하단 스크롤 안내 버튼 */}
        <button
          onClick={scrollToMore}
          className="group flex flex-col items-center justify-center pb-12 text-[#666666] transition-all hover:text-[#2A6AFF]"
        >
          <ChevronDown
            size={50}
            className="transition-transform group-hover:translate-y-1"
          />
        </button>
      </div>

      {/* 통합된 랜딩 페이지 섹션 - 랜딩 페이지 디자인 유지 */}
      <div className="flex flex-col gap-[120px] pb-[120px] md:gap-[180px] md:pb-[180px]">
        <div
          id="intro-homescreen"
          className="scroll-mt-[40px]"
        >
          <FeatureSection
            title={["뷰어를 함께 보면서", "AI튜터에게 질문하기"]}
            description={[
              "뷰어로 볼 파일을 업로드하면 AI튜터와 함께 보면서",
              "대화할 수 있어요.",
            ]}
            imageSrc="/landing/illust_viewer_detail.png"
            imageAlt="Viewer and AI Tutor"
          />
        </div>

        <FeatureSection
          title={["PC, 태블릿", "어디서든 자유롭게"]}
          description={[
            "기기에 구애받지 않고 언제 어디서나 프루비를",
            "사용할 수 있어요.",
          ]}
          imageSrc="/landing/illust_viewer_laptop.png"
          isReversed
          imageAlt="Problem Selection"
        />

        <FeatureGrid />

        <div className="scroll-mt-[40px]">
          <CTASection />
        </div>

        <FAQSection />
      </div>
    </div>
  );
};
