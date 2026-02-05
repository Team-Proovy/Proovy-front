import { ChevronDown, X } from "lucide-react";
import { useFileUpload } from "../shared/hooks/useFileUpload";
import { useStorageStore } from "../features/storage/store/useStorageStore";
import { PdfIcon } from "../shared/components/icons/HomepageInputIcons";
import { ChatInput } from "../features/editor/components/ChatInput";
import { useState } from "react";
import { PdfPreview } from "../shared/components/pdf-preview/PdfPreview";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
/**
 * HomePage - 새 노트 시작점
 *
 * URL: /app/home
 * 레이아웃: AppLayout (Outlet)에서 렌더링됨
 *
 * 기능:
 * - 파일 업로드 또는 텍스트 입력으로 새 노트 생성
 * - 첫 메시지 전송 시 노트 자동 생성 → /app/chat/:chatId 로 이동
 */
export const HomePage = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { uploadAsset } = useAssetUpload();
  // 파일 업로드 훅 사용
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    async (file) => {
      if (
        file &&
        (file.type === "application/pdf" ||
          file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/jpg")
      ) {
        setFileName(file.name);
        const url = URL.createObjectURL(file);
        setPdfUrl(url); // 변수명은 pdfUrl이지만 이제 이미지 url도 담길 수 있음
        try {
          // 이 부분이 진짜 파일 업로드 시작 부분 --> 유효한 noteId 를 넣어야 500 에러 안 남
          const VALID_NOTE_ID = 1;
          const result = await uploadAsset(VALID_NOTE_ID, file);
          console.log("파일 업로드 성공!");

          // 성공 시 StorageStore에 추가
          const { addNote } = useStorageStore.getState();
          addNote({
            id: result?.assetId ?? Date.now(), // assetId가 없으면 임시 ID 사용
            label: file.name,
            type: "업로드",
            // fileUrl: url, // 로컬 미리보기 URL 사용
            // mimeType: file.type,
          });
        } catch (error) {
          console.error("파일 업로드 실패:", error);
        }
      }
    },
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 이벤트 전파 방지
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    // AppLayout의 Outlet에서 렌더링됨 - 정중앙 배치
    <div className="flex h-full w-full flex-col bg-white">
      {/* 메인 컨텐츠 영역 - 정중앙 배치 */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 pt-[100px]">
        {/* 컨텐츠 너비는 내부 요소에 맞게 자동 계산 */}
        <div className="flex w-fit flex-col">
          {/* 상단 타이틀 영역 */}
          <div className="mb-8">
            <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
              파일을 업로드하고 완벽한 해설을,
            </h1>
          </div>

          {/* 메인 입력 카드 */}
          <div className="mb-10 flex gap-6">
            {/* hidden input for file upload */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf .jpg .jpeg .png"
            />

            {pdfUrl ? (
              /* PDF 업로드 완료 시: 카드 형태 UI */
              <div className="group relative flex h-[160px] w-[220px] flex-col items-center overflow-hidden rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-all">
                {/* 닫기 버튼: 우상단 고정 */}
                <button
                  onClick={handleRemove}
                  className="absolute top-[12px] right-[12px] z-10 flex cursor-pointer items-center justify-center"
                >
                  <X
                    size={20}
                    color="#000000"
                  />
                </button>

                {/* 상단: PDF 썸네일 영역 (세로 고정, 위아래 잘림 처리) */}
                <div className="relative flex h-[140px] w-[160px] items-start justify-center overflow-hidden">
                  <div className="flex h-full w-full items-center justify-center">
                    {/* 이미지 파일이면 img 태그, PDF면 PdfPreview */}
                    {fileName.toLowerCase().endsWith(".pdf") ? (
                      <PdfPreview
                        key={pdfUrl}
                        fileUrl={pdfUrl}
                        width={160}
                      />
                    ) : (
                      <img
                        src={pdfUrl}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* 하단: 파일명 영역 */}
                <div className="flex h-[50px] w-full items-center justify-center border-t-[0.5px] border-[#C6C6C6] bg-white px-3">
                  <p className="truncate text-[13px] font-medium text-[#333333]">
                    {fileName}
                  </p>
                </div>

                {/* Hover Overlay: 전체 영역 어둡게 처리 */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ) : (
              /* 기본 상태: 업로드 버튼 */
              <button
                onClick={openFileExplorer}
                className="group flex h-[160px] w-[220px] cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
              >
                <div>
                  <PdfIcon size={56} />
                </div>
                <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
                  뷰어로 파일 업로드
                </p>
              </button>
            )}

            {/* 오른쪽: 텍스트 입력 섹션 */}
            <ChatInput />
          </div>

          {/* 하단 예시 섹션 */}
          <div className="space-y-4">
            <p className="text-[18px] font-semibold text-[#6B6B6B]">
              또는 다음 예시로 시작해 보세요.
            </p>
          </div>
        </div>
      </div>

      {/* 맨 하단 스크롤 안내 - 항상 하단 고정 */}
      <div className="flex w-full flex-col items-center justify-center pb-8 text-[#666666]">
        <p className="mb-2 text-[18px] font-semibold">
          내려서 다양한 예시 확인하기
        </p>
        <ChevronDown size={50} />
      </div>
    </div>
  );
};
