import { ChevronDown } from "lucide-react";
import { useFileUpload } from "../shared/hooks/useFileUpload";
import { PdfIcon } from "../shared/components/icons/HomepageInputIcons";
import { ChatInput } from "../features/editor/components/ChatInput";

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
  // 파일 업로드 훅 사용
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    (file) => {
      // TODO: 선택된 파일 처리 로직 (예: 서버 전송, 상태 저장 등)
      console.log("HomePage에서 파일 선택됨:", file);
    },
  );

  return (
    // AppLayout의 Outlet에서 렌더링됨 - 정중앙 배치
    <div className="flex h-full w-full flex-col bg-white">
      {/* 메인 컨텐츠 영역 - 정중앙 배치 */}
      <div className="flex flex-1 flex-col items-center justify-center px-5">
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
              accept=".pdf,.png,.jpg,.jpeg,.txt"
            />
            {/* 왼쪽: 업로드 섹션 */}
            <button
              onClick={openFileExplorer}
              className="group flex h-[160px] w-[220px] shrink-0 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-[0.5px] border-[#C6C6C6] bg-white/40 px-5 py-9 shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
            >
              <div>
                <PdfIcon size={56} />
              </div>
              <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0] group-active:text-[#2542F0]">
                뷰어로 파일 업로드
              </p>
            </button>

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
