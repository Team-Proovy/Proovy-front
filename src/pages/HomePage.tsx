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

  const navigateToEditor = (text: string) => {
    navigate("/testPage", { state: { initialInput: text } });
  };

  return (
    <AppLayout>
      {/* 1. 전체 컨테이너: 높이를 꽉 채우고(min-h-full) 요소들을 세로로 배치 */}
      <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col items-center px-6 pt-[320px] pb-10">
        {/* 2. 상단 타이틀 영역 */}
        <div className="mb-8 w-full">
          <h1 className="font-['Pretendard'] text-[40px] font-semibold leading-[52px] tracking-[-0.008px] text-black">
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
            className="flex h-[176px] w-[220px] cursor-pointer flex-col items-center justify-center gap-[10px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[42px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors hover:bg-gray-100"
          >
            <div>
              <PdfIcon size={48} />
            </div>
            <p className="text-sm font-medium text-gray-500">
              뷰어로 파일 업로드
            </p>
          </button>

          {/* 오른쪽: 텍스트 입력 섹션 */}
          <div className="flex h-[176px] w-[952px] shrink-0 flex-col rounded-2xl border border-[#C6C6C6] bg-white p-5 shadow-sm">
            <textarea
              placeholder="@을 통해 도구를 선택하거나, 요청을 입력하세요."
              className="flex-1 resize-none text-base text-gray-600 outline-none placeholder:text-gray-300"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="flex items-center justify-center rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-gray-500 transition-colors duration-700 hover:border-[#2A6AFF] hover:bg-[#2A6AFF] hover:text-white">
                  <Paperclip size={16} />
                </button>
                <ToolChip label="수식 입력기" />
                <ToolChip label="캔버스" />
                <div className="relative">
                  <ToolChip
                    icon={
                      <ToolIcon
                        size={14}
                        color="currentColor"
                      />
                    }
                    label="도구"
                    suffix={<ChevronDown size={14} />}
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
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F2F2] text-[#555555] transition-colors hover:bg-gray-200 active:scale-95">
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
          <p className="text-sm text-gray-400">
            또는 다음 예시로 시작해 보세요.
          </p>
          <div className="flex flex-col items-start gap-3">
            {/* 예시 제시문들 띄우기 */}
            <button
              onClick={() =>
                navigateToEditor("미분방정식의 해를 구하는 과정을 보여줘")
              }
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-[#2A6AFF] hover:text-[#2A6AFF]"
            >
              미분방정식의 해를 구하는 과정을 보여줘
            </button>
            <button
              onClick={() => navigateToEditor("피타고라스 정리를 증명해줘")}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-[#2A6AFF] hover:text-[#2A6AFF]"
            >
              피타고라스 정리를 증명해줘
            </button>
            <button
              onClick={() =>
                navigateToEditor("이차함수의 최대값과 최소값을 구하는 방법")
              }
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-[#2A6AFF] hover:text-[#2A6AFF]"
            >
              이차함수의 최대값과 최소값을 구하는 방법
            </button>
          </div>
        </div>

        {/* 5. 맨 하단 스크롤 안내 (mt-auto로 맨 아래로 밀기)- 수정 필요함*/}
        <div className="mt-auto flex animate-bounce flex-col items-center text-gray-400">
          <p className="mb-2 text-xs">내려서 다양한 예시 확인하기</p>
          <ChevronDown size={24} />
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
}
function ToolChip({
  label,
  icon,
  suffix,
  onSuffixClick,
  onSuffixMouseEnter,
  onSuffixMouseLeave,
}: ToolChipProps) {
  return (
    <button className="group flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-6 py-1.5 text-xs font-medium text-gray-500 transition-colors duration-700 hover:border-[#2A6AFF] hover:bg-[#2A6AFF] hover:text-white">
      {icon && (
        <span className="text-gray-400 group-hover:text-white">{icon}</span>
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
