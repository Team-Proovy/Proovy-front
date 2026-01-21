import { AppLayout } from "../shared/layout/AppLayout";
import { ArrowUp, ChevronDown, Paperclip } from "lucide-react"; // 화살표 아이콘
import { useFileUpload } from "../shared/hooks/use_file_upload";
import {
  PdfIcon,
  ToolIcon,
} from "../shared/components/icons/HomepageInputIcons";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function HomePage() {
  const navigate = useNavigate();
  const [isToolMenuOpen, setIsToolMenuOpen] = React.useState(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsToolMenuOpen(true);
  };

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsToolMenuOpen(false);
    }, 150);
  };

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
          <div className="flex h-[160px] w-[660px] flex-col rounded-2xl border-[0.5px] border-[#C6C6C6] bg-white p-5 shadow-[4px_4px_20px_0px_rgba(0,0,0,0.05)]">
            <textarea
              placeholder="@을 통해 도구를 선택하거나, 요청을 입력하세요."
              className="flex-1 resize-none text-[18px] font-normal text-gray-600 outline-none placeholder:text-[#666666]"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="flex h-[32px] w-[56px] items-center justify-center rounded-full border border-[#C6C6C6] bg-[#F5F5F5] px-3 py-1.5 text-[#666666] transition-colors duration-700 hover:border-[#2A6AFF] hover:bg-[#2A6AFF] hover:text-white">
                  <Paperclip size={16} />
                </button>
                <ToolChip label="수식 입력기" />
                <ToolChip label="캔버스" />
                <div className="relative">
                  <ToolChip
                    className="!px-[12px]"
                    icon={
                      <ToolIcon
                        size={25}
                        color="currentColor"
                      />
                    }
                    label="도구"
                    suffix={<ChevronDown size={25} />}
                    onSuffixMouseEnter={openMenu}
                    onSuffixMouseLeave={closeMenu}
                    onSuffixClick={openMenu}
                  />
                  {isToolMenuOpen && (
                    <div
                      className="absolute top-full left-0 z-10 mt-2 flex w-48 flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
                      onMouseEnter={openMenu}
                      onMouseLeave={closeMenu}
                    >
                      <DropdownItem label="그래프 그리기" />
                      <DropdownItem label="해설지 생성하기" />
                      <DropdownItem label="캔버스 열기" />
                      <DropdownItem label="코드 검산 진행하기" />
                    </div>
                  )}
                </div>
              </div>
              <button className="flex h-[48px] w-[48px] items-center justify-center rounded-xl bg-[#F2F2F2] text-[#555555] transition-colors duration-400 hover:bg-[#2A6AFF] hover:text-white active:scale-95">
                <ArrowUp
                  size={20}
                  strokeWidth={3}
                />
              </button>
            </div>
          </div>
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

// 추가 로직 구현 파트
interface ToolChipProps {
  label: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  onSuffixClick?: (e: React.MouseEvent) => void;
  onSuffixMouseEnter?: () => void;
  onSuffixMouseLeave?: () => void;
  className?: string;
}
function ToolChip({
  label,
  icon,
  suffix,
  onSuffixClick,
  onSuffixMouseEnter,
  onSuffixMouseLeave,
  className,
}: ToolChipProps) {
  return (
    <button
      className={`group flex h-[32px] items-center justify-center gap-2 rounded-full border border-[#c6c6c6b2] bg-[#F5F5F5] px-[35px] text-[16px] font-medium text-[#666666] transition-colors duration-700 hover:border-[#2A6AFF] hover:bg-[#2A6AFF] hover:text-white ${className}`}
    >
      {icon && (
        <span className="text-[#666666] group-hover:text-white">{icon}</span>
      )}
      <span>{label}</span>
      {suffix && (
        <span
          className="text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onSuffixClick?.(e);
          }}
          onMouseEnter={onSuffixMouseEnter}
          onMouseLeave={onSuffixMouseLeave}
        >
          {suffix}
        </span>
      )}
    </button>
  );
}

function DropdownItem({ label }: { label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">
      <div className="h-4 w-4 rounded-full bg-gray-200" />
      <span>{label}</span>
    </button>
  );
}
