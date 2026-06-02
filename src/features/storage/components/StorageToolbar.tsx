import { useId } from "react";
import { StorageSearchIcon } from "../../../shared/components/icons/StorageIcons";
import { useStorageStore } from "../store/useStorageStore";
import { UploadCreateToggle } from "./UploadCreateToggle";

type ToggleTab = "upload" | "create";

interface StorageToolbarProps {
  totalUsedDisplay: string;
  totalLimitDisplay: string;
  usagePercent: number;
  onSearch: (keyword: string) => void;
  activeTab: ToggleTab;
  onTabChange: (tab: ToggleTab) => void;
}

export const StorageToolbar = ({
  totalUsedDisplay,
  totalLimitDisplay,
  usagePercent,
  onSearch,
  activeTab,
  onTabChange,
}: StorageToolbarProps) => {
  const rawFilterId = useId();
  const filterId = `storage-toolbar-filter-${rawFilterId.replace(/:/g, "")}`;
  const isDanger = usagePercent >= 90;
  const barColor = isDanger ? "#FF4D4D" : "#2A6AFF";
  const barWidth = Math.min((usagePercent / 100) * 55.5, 55.5);

  const { isSelectMode, toggleSelectMode, setDeleteModalOpen, selectedIds } =
    useStorageStore();

  const handleSelectToggle = () => {
    toggleSelectMode();
  };

  const handleDeleteClick = () => {
    if (selectedIds.length > 0) {
      setDeleteModalOpen(true);
    }
  };

  return (
    <div className="mb-[8px] grid w-full [grid-template-columns:1fr_auto] items-center gap-x-[32px]">
      <div className="flex items-center gap-[20px]">
        <div className="relative h-8 max-w-110 min-w-45 flex-1">
          <input
            type="text"
            placeholder="검색어를 입력해주세요."
            onChange={(e) => onSearch(e.target.value)}
            className="h-full w-full rounded-[70px] border-[0.5px] border-[#D1D6DE] bg-white py-[6px] pr-[40px] pl-[16px] font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black outline-none placeholder:font-['Pretendard'] placeholder:text-[14px] placeholder:leading-[20px] placeholder:font-medium placeholder:text-[#9CA4B0]"
          />
          <button
            type="button"
            className="absolute top-[6px] right-[13px] flex h-[20px] w-[20px] cursor-pointer items-center justify-center transition-opacity hover:opacity-70"
          >
            <StorageSearchIcon
              style={{
                width: "20px",
                height: "20px",
              }}
            />
          </button>
        </div>
        {/* 선택/취소 + 삭제 버튼 (노트목록 디자인 통일) */}
        {isSelectMode ? (
          <div className="flex items-center gap-[8px]">
            <button
              onClick={handleSelectToggle}
              className="flex h-8 w-14 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] leading-5 font-medium text-[#9CA4B0] transition-colors duration-200 hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white"
              type="button"
            >
              취소
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={selectedIds.length === 0}
              className="flex h-8 w-20 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] leading-5 font-medium text-[#2A6AFF] transition-colors duration-200 hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              삭제하기
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleSelectToggle}
              className="flex h-8 w-14 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] leading-5 font-medium text-[#9CA4B0] transition-colors duration-200 hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white active:border-transparent active:bg-[#2A6AFF] active:text-white"
              type="button"
            >
              선택
            </button>
            <UploadCreateToggle
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </>
        )}
      </div>
      <div
        className="shrink-0 justify-self-end"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
        }}
      >
        <span
          style={{
            color: "#000",
            fontFamily: "Pretendard",
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: 500,
            lineHeight: "20px",
            alignSelf: "flex-end",
          }}
        >
          전체 용량
        </span>
        <div className="flex items-center gap-[11px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="12"
            viewBox="0 0 56 12"
            fill="none"
          >
            <rect
              x="0.25"
              y="0.25"
              width="55.5"
              height="11.5"
              rx="5.75"
              fill="white"
              stroke="#D1D6DE"
              strokeWidth="0.5"
            />
            <g filter={`url(#${filterId})`}>
              <rect
                width={barWidth}
                height="12"
                rx="6"
                fill={barColor}
              />
            </g>
            <defs>
              <filter
                id={filterId}
                x="0"
                y="0"
                width={barWidth}
                height="13"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood
                  floodOpacity="0"
                  result="BackgroundImageFix"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite
                  in2="hardAlpha"
                  operator="arithmetic"
                  k2="-1"
                  k3="1"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                />
                <feBlend
                  mode="normal"
                  in2="shape"
                  result="effect1_innerShadow_781_1618"
                />
              </filter>
            </defs>
          </svg>
          <div className="flex items-center">
            <span
              style={{
                color: barColor,
                fontFamily: "Pretendard",
                fontSize: "13px",
                fontStyle: "normal",
                fontWeight: 700,
                lineHeight: "18px",
              }}
            >
              {totalUsedDisplay}
            </span>
            <span
              style={{
                color: "#000",
                fontFamily: "Pretendard",
                fontSize: "13px",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "18px",
              }}
            >
              /{totalLimitDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
