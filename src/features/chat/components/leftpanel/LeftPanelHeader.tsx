type PanelTab = "viewer" | "storage";

interface LeftPanelHeaderProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
}

export const LeftPanelHeader = ({
  activeTab,
  onTabChange,
}: LeftPanelHeaderProps) => {
  return (
    <div className="flex h-[40px] w-full shrink-0 items-center justify-center border-b-[0.5px] border-[#D1D6DE] bg-white px-4">
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
            <div className="absolute right-0 bottom-[2px] left-0 h-[2px] bg-[#2A6AFF]" />
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
            <div className="absolute right-0 bottom-[2px] left-0 h-[2px] bg-[#2A6AFF]" />
          )}
        </button>
      </div>
    </div>
  );
};

export type { PanelTab };
