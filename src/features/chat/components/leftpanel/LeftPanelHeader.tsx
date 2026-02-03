import { X } from "lucide-react";

type PanelTab = "viewer" | "storage";

interface LeftPanelHeaderProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
}

export const LeftPanelHeader = ({
  activeTab,
  onTabChange,
  onClose,
}: LeftPanelHeaderProps) => {
  return (
    <div className="relative flex h-[50px] w-full max-w-[720px] min-w-[270px] shrink-0 items-center justify-center border-[0.5px] border-[#D1D6DE] bg-white px-4">
      {/* 탭 버튼들 - 가운데 정렬 */}
      <div className="flex items-center gap-0">
        {/* Viewer 탭 */}
        <button
          onClick={() => onTabChange("viewer")}
          className={`relative px-[10px] py-[10px] text-[16px] font-bold transition-colors ${
            activeTab === "viewer"
              ? "text-[#2A6AFF]"
              : "text-[#9CA4B0] hover:text-gray-600"
          }`}
        >
          Viewer
          {/* 하단 인디케이터 */}
          {activeTab === "viewer" && (
            <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#2A6AFF]" />
          )}
        </button>

        {/* Storage 탭 */}
        <button
          onClick={() => onTabChange("storage")}
          className={`relative px-[10px] py-[10px] text-[16px] font-bold transition-colors ${
            activeTab === "storage"
              ? "text-[#2A6AFF]"
              : "text-[#9CA4B0] hover:text-gray-600"
          }`}
        >
          Storage
          {/* 하단 인디케이터 */}
          {activeTab === "storage" && (
            <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#2A6AFF]" />
          )}
        </button>
      </div>

      {/* 닫기 버튼 - 오른쪽 고정 */}
      <button
        onClick={onClose}
        className="absolute right-4 flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        title="닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export type { PanelTab };
