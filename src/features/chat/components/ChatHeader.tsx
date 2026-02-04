import {
  PanelOpenIcon,
  PanelCloseIcon,
} from "@/shared/components/icons/PanelToggleIcons";

interface ChatHeaderProps {
  title: string;
  isViewerOpen: boolean;
  onToggleViewer: () => void;
}

export const ChatHeader = ({
  title,
  isViewerOpen,
  onToggleViewer,
}: ChatHeaderProps) => {
  return (
    <div className="relative flex h-[40px] w-full shrink-0 items-center justify-center rounded-b-[20px] border-[0.5px] border-[#D1D6DE] bg-white px-4">
      {/* 토글 버튼 - 왼쪽 고정 */}
      <button
        onClick={onToggleViewer}
        className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] transition-colors hover:text-[#2A6AFF]"
        title={isViewerOpen ? "뷰어 닫기" : "뷰어 열기"}
      >
        {isViewerOpen ? (
          <PanelCloseIcon size={32} />
        ) : (
          <PanelOpenIcon size={32} />
        )}
      </button>

      {/* 채팅 제목 - 가운데 정렬 */}
      <h1 className="text-[18px] leading-[28px] font-semibold tracking-[-0.018%] text-black">
        {title}
      </h1>
    </div>
  );
};
