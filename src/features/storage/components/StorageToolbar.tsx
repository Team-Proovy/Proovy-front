import { StorageSearchIcon } from "../../../shared/components/icons/StorageIcons";
import { useStorageStore } from "../store/useStorageStore";

interface StorageToolbarProps {
  responsivePaddingL: string;
  responsivePaddingR: string;
}

export const StorageToolbar = ({
  responsivePaddingL,
  responsivePaddingR,
}: StorageToolbarProps) => {
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
    <div
      className={`mb-[60px] flex items-center justify-between ${responsivePaddingL} ${responsivePaddingR}`}
    >
      <div className="flex flex-1 items-center gap-[20px]">
        <div
          className="relative"
          style={{ width: "440px", height: "32px" }}
        >
          <input
            type="text"
            placeholder="검색어를 입력해주세요."
            className="h-full w-full rounded-[70px] border-[0.5px] border-[#C6C6C6] bg-white py-[6px] pr-[40px] pl-[16px] font-['Pretendard'] text-[14px] leading-[20px] font-medium text-[#6B6B6B] outline-none placeholder:font-['Pretendard'] placeholder:text-[14px] placeholder:leading-[20px] placeholder:font-medium placeholder:text-[#6B6B6B]"
          />
          <StorageSearchIcon
            style={{
              position: "absolute",
              top: "6px",
              right: "13px",
              width: "20px",
              height: "20px",
            }}
          />
        </div>
        <button
          onClick={handleActionClick}
          className="flex items-center justify-center rounded-xl border border-gray-200 bg-white font-['Pretendard'] text-[14px] font-medium text-[#6B6B6B] shadow-sm transition-all hover:bg-gray-50"
          style={{
            width: isSelectMode ? "80px" : "56px",
            height: "32px",
          }}
        >
          {isSelectMode ? "삭제하기" : "선택"}
        </button>
      </div>

      <div className="flex items-center">
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
                stroke="#C6C6C6"
                strokeWidth="0.5"
              />
              <g filter="url(#filter0_i_781_1618)">
                <rect
                  width="47.0909"
                  height="12"
                  rx="6"
                  fill="#2A6AFF"
                />
              </g>
              <defs>
                <filter
                  id="filter0_i_781_1618"
                  x="0"
                  y="0"
                  width="47.0909"
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
                  color: "#2A6AFF",
                  fontFamily: "Pretendard",
                  fontSize: "13px",
                  fontStyle: "normal",
                  fontWeight: 700,
                  lineHeight: "18px",
                }}
              >
                2.7
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
                /3GB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
