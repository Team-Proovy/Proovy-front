import { AppLayout } from "../shared/layout/app_layout";
import { ArrowUp, ChevronDown, LayoutGrid, Paperclip } from "lucide-react"; // 화살표 아이콘
import React from "react";

export default function HomePage() {
  return (
    <AppLayout>
      {/* 1. 전체 컨테이너: 높이를 꽉 채우고(min-h-full) 요소들을 세로로 배치 */}
      <div className="flex min-h-full w-full max-w-4xl flex-col items-center px-6 pt-32 pb-10">
        {/* 2. 상단 타이틀 영역 */}
        <div className="mb-8 w-full">
          <h1 className="text-3xl font-bold text-gray-900">
            파일을 업로드하고 완벽한 해설을,
          </h1>
        </div>

        {/* 3. 메인 입력 카드 */}
        <div className="mb-10 flex h-44 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* 왼쪽: 업로드 섹션 */}
          <button className="flex w-44 flex-col items-center justify-center border-r border-gray-100 transition-colors hover:bg-gray-50">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
              <span className="text-3xl">+</span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              뷰어로 파일 업로드
            </p>
          </button>

          {/* 오른쪽: 텍스트 입력 섹션 */}
          <div className="flex flex-1 flex-col p-5">
            <textarea
              placeholder="@을 통해 도구를 선택하거나, 요청을 입력하세요."
              className="flex-1 resize-none text-base text-gray-600 outline-none placeholder:text-gray-300"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="flex items-center justify-center rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-gray-500 hover:bg-gray-200">
                  <Paperclip size={16} />
                </button>
                <ToolChip label="수식 입력기" />
                <ToolChip label="캔버스" />
                <ToolChip
                  icon={<LayoutGrid size={14} />}
                  label="도구"
                />
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
          <div className="flex flex-wrap gap-3">
            {/* 그라데이션 컴포넌트 3개 일단은 틀만 잡아서 구현해 둠 */}
            <div className="h-8 w-40 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 opacity-50" />
            <div className="h-8 w-64 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 opacity-50" />
            <div className="h-8 w-80 rounded-full bg-gradient-to-r from-blue-100 to-blue-300 opacity-40" />
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

interface ToolChipProps {
  label: string;
  icon?: React.ReactNode;
}
function ToolChip({ label, icon }: ToolChipProps) {
  return (
    <button className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-6 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
