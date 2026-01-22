import { AppLayout } from "../shared/layout/AppLayout";
import { ChevronDown} from "lucide-react"; // 화살표 아이콘
import { useFileUpload } from "../shared/hooks/useFileUpload";
import {
  PdfIcon,

} from "../shared/components/icons/HomepageInputIcons";
import { ChatInput } from "../features/editor/components/ChatInput";
export default function HomePage() {




  // 파일 업로드 훅 사용
  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    (file) => {
      // TODO: 선택된 파일 처리 로직 (예: 서버 전송, 상태 저장 등)
      console.log("HomePage에서 파일 선택됨:", file);
    },
  );

  return (
    <AppLayout backgroundColor="bg-white">
      {/* 1. 전체 컨테이너: 높이를 꽉 채우고(min-h-full) 요소들을 세로로 배치 */}
      <div className="flex min-h-screen w-full flex-1 flex-col pt-[39vh] pr-[20px] pb-[37px] pl-[20px]">
        {/* 2. 상단 타이틀 영역 */}
        <div className="mb-8 w-full max-w-[530px]">
          <h1 className="text-[40px] leading-[52px] font-semibold tracking-[-0.008px] text-black">
            파일을 업로드하고 완벽한 해설을,
          </h1>
        </div>

        {/* 3. 메인 입력 카드 */}
        <div className="mb-10 flex h-44 w-full gap-6">
          {/* hidden input for file upload */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.txt" // 필요에 따라 허용 확장자 설정
          />
          {/* 왼쪽: 업로드 섹션 */}
          <button
            onClick={openFileExplorer}
            className="group flex h-[160px] w-[220px] cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
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

        {/* 4. 하단 예시 섹션 */}
        <div className="w-full space-y-4">
          <p className="text-[18px] font-semibold text-[#6B6B6B]">
            또는 다음 예시로 시작해 보세요.
          </p>
        </div>

        {/* 5. 맨 하단 스크롤 안내 (mt-auto로 하단 고정, 공간 부족시 스크롤 발생) */}
        <div className="mt-auto flex w-full flex-col items-center justify-center text-[#666666]">
          <p className="mb-2 text-[18px] font-semibold">
            내려서 다양한 예시 확인하기
          </p>
          <ChevronDown size={50} />
        </div>
      </div>
    </AppLayout>
  );
}

