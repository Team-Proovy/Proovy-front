import { StorageSearchIcon } from "../../../shared/components/icons/StorageIcons";
import { useStorageStore } from "../store/useStorageStore";


// 수정 후
interface StorageToolbarProps {
  responsivePaddingL: string;
  responsivePaddingR: string;
  totalUsedDisplay: string;  // "0.43GB"
  totalLimitDisplay: string; // "3GB"
  usagePercent: number;      // 14
  onSearch: (keyword: string) => void; // 검색 함수
 
}



export const StorageToolbar = ({
  responsivePaddingL: _responsivePaddingL,
  responsivePaddingR: _responsivePaddingR,
  totalUsedDisplay,
  totalLimitDisplay,
  usagePercent,
  onSearch,
}: StorageToolbarProps) => {
  // Logic moved inside component
  const isDanger = usagePercent >= 90;
  const barColor = isDanger ? "#FF4D4D" : "#2A6AFF";
  const barWidth = Math.min((usagePercent / 100) * 55.5, 55.5); // Ensure it doesn't exceed container

  const { isSelectMode, toggleSelectMode, setDeleteModalOpen, selectedIds } =
    useStorageStore();

  const handleActionClick = () => {
    if (isSelectMode) {
      if (selectedIds.length > 0) {
        setDeleteModalOpen(true);
      }
    } else {
      toggleSelectMode();
    }
  };

  return (
    <div className="3xl:max-w-[1360px] relative mx-auto mb-[8px] flex w-full max-w-[520px] items-center lg:max-w-[800px] 2xl:max-w-[1080px]">
      <div className="flex flex-1 items-center gap-[20px]">
        <div
          className="relative w-[220px] lg:w-[440px]"
          style={{ height: "32px" }}
        >
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
        <button
          onClick={handleActionClick}
          className={`flex items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-['Pretendard'] text-[14px] font-medium transition-all hover:border-[#2A6AFF] hover:bg-[#2A6AFF] hover:text-white ${
            isSelectMode ? "text-[#2A6AFF] border-[#2A6AFF]" : "text-[#9CA4B0]"
          }`}
          style={{
            width: isSelectMode ? "80px" : "56px",
            height: "32px",
          }}
        >
          {isSelectMode ? "삭제하기" : "선택"}
        </button>
      </div>

      <div className="absolute right-[20px] flex items-center">
        <div
          style={{
            display: "flex",
            width: "113px",
            flexDirection: "column",
            alignItems: "flex-start",
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
              alignSelf: "stretch",
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
              <g filter="url(#filter0_i_781_1618)">
                <rect
                  width={barWidth}
                  height="12"
                  rx="6"
                  fill={barColor}
                />
              </g>
              <defs>
                <filter
                  id="filter0_i_781_1618"
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
    </div>
  );
};
