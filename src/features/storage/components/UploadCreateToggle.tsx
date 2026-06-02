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
    <div className="relative h-8 w-[110px] shrink-0 rounded-full border-[0.5px] border-[#D1D6DE] bg-white">
      {/* 슬라이딩 활성 pill */}
      <div
        className={`absolute top-0.5 h-7 w-[61px] rounded-full bg-[#2A6AFF]/20 transition-all duration-200 ${
          activeTab === "upload" ? "left-0.5" : "left-[47px]"
        }`}
      />

      {/* 업로드 버튼 */}
      <button
        type="button"
        onClick={() => onTabChange("upload")}
        className={`absolute top-0 left-0 flex h-full w-[55px] items-center justify-center font-[Pretendard] text-[14px] transition-colors duration-200 ${
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
        onClick={() => onTabChange("create")}
        className={`absolute top-0 right-0 flex h-full w-[55px] items-center justify-center font-[Pretendard] text-[14px] transition-colors duration-200 ${
          activeTab === "create"
            ? "font-semibold text-[#2A6AFF]"
            : "font-medium text-[#9CA4B0]"
        }`}
      >
        생성
      </button>
    </div>
  );
};
