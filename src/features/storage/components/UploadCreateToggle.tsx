type ToggleTab = "upload" | "create";

interface UploadCreateToggleProps {
  activeTab: ToggleTab;
  onTabChange: (tab: ToggleTab) => void;
}

export const UploadCreateToggle = ({
  activeTab,
  onTabChange,
}: UploadCreateToggleProps) => {
  return (
    <div
      className="relative h-[32px] w-[110px] shrink-0 overflow-hidden rounded-full border-[0.5px] border-[#D1D6DE] bg-white"
      role="tablist"
      aria-label="저장소 파일 보기 방식"
    >
      <div className="absolute inset-[2px] grid grid-cols-2">
        <div
          className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#2A6AFF]/20 transition-transform duration-200 ease-out ${
            activeTab === "create" ? "translate-x-full" : "translate-x-0"
          }`}
        />

        {/* 업로드 버튼 */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "upload"}
          onClick={() => onTabChange("upload")}
          className={`relative z-10 flex h-full min-w-0 items-center justify-center rounded-full font-[Pretendard] text-[14px] transition-colors duration-200 ${
            activeTab === "upload"
              ? "font-semibold text-[#2A6AFF]"
              : "font-medium text-[#9CA4B0]"
          }`}
        >
          업로드
        </button>

        {/* 생성 버튼 */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "create"}
          onClick={() => onTabChange("create")}
          className={`relative z-10 flex h-full min-w-0 items-center justify-center rounded-full font-[Pretendard] text-[14px] transition-colors duration-200 ${
            activeTab === "create"
              ? "font-semibold text-[#2A6AFF]"
              : "font-medium text-[#9CA4B0]"
          }`}
        >
          생성
        </button>
      </div>
    </div>
  );
};
