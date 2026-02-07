import { ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFileUpload } from "../shared/hooks/useFileUpload";
import { PdfIcon } from "../shared/components/icons/HomepageInputIcons";
import { ChatInput } from "../features/editor/components/ChatInput";
import { useState } from "react";
import { PdfPreview } from "../shared/components/pdf-preview/PdfPreview";
import { useCreateNote } from "../features/notes/hooks/useNotes";
import type { CreateNoteRequest } from "../features/notes/api/notes_types";

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
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const createNoteMutation = useCreateNote();

  const handleSendWithPayload = (payload: CreateNoteRequest) => {
    createNoteMutation.mutate(payload, {
      onSuccess: (res) => {
        const noteId = res.result?.noteId;
        if (noteId != null) {
          navigate(`/app/chat/${noteId}`);
        } else {
          console.error("노트 생성 응답에 noteId가 없습니다.", res);
        }
      }
      },
    });
  };

  // 파일 업로드 훅 사용
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    (file) => {
      // 선택된 파일 처리 로직
      // console.log("HomePage에서 파일 선택됨:", file);

      if (file && file.type === "application/pdf") {
        setFileName(file.name);
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
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
              accept=".pdf"
            />

            {pdfUrl ? (
              /* PDF 업로드 완료 시: 카드 형태 UI */
              <div className="group relative flex h-[160px] w-[220px] flex-col items-center overflow-hidden rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-all">
                {/* 상단: PDF 썸네일 영역 (세로 고정, 위아래 잘림 처리) */}
                <div className="relative flex h-[160px] w-[140px] items-start justify-center overflow-hidden bg-[#F2F2F2]">
                  <div className="w-full">
                    <PdfPreview
                      fileUrl={pdfUrl}
                      width={140}
                    />
                  </div>

                  {/* Hover 오버레이: 어두워지면서 X 아이콘 등장 */}
                  <div className="absolute inset-0 flex items-start justify-end bg-black/20 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                      onClick={handleRemove}
                      className="cursor-pointer rounded-full bg-white/10 p-1 transition-colors hover:bg-white/30"
                    >
                      <X
                        size={20}
                        color="black"
                      />
                    </button>
                  </div>
                </div>

                {/* 하단: 파일명 영역 */}
                <div className="flex h-[50px] w-full items-center justify-center border-t-[0.5px] border-[#C6C6C6] bg-white px-3">
                  <p className="truncate text-[13px] font-medium text-[#333333]">
                    {fileName}
                  </p>
                </div>
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
            <ChatInput
              onSendWithPayload={handleSendWithPayload}
              isSendPending={createNoteMutation.isPending}
            />
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
