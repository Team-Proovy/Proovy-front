import { PanelLeftOpen } from "lucide-react";

interface RightPanelHeaderProps {
  title: string;
  isViewerOpen: boolean;
  onToggleViewer: () => void;
}

export const RightPanelHeader = ({
  title,
  isViewerOpen,
  onToggleViewer,
}: RightPanelHeaderProps) => {
  return (
    <div className="relative flex h-[50px] w-full max-w-[720px] min-w-[270px] shrink-0 items-center justify-center rounded-b-[20px] border-[0.5px] border-[#D1D6DE] bg-white px-4">
      {/* 토글 버튼 - 뷰어가 닫혀있을 때만 표시 (왼쪽 고정) */}
      {!isViewerOpen && (
        <button
          onClick={onToggleViewer}
          className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="뷰어 열기"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* 채팅 제목 - 가운데 정렬 */}
      <h1 className="text-[18px] leading-[28px] font-semibold tracking-[-0.018%] text-black">
        {title}
      </h1>
    </div>
  );
};
