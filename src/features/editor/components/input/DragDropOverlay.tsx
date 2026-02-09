/** 파일 드래그 앤 드롭 오버레이 */
export const DragDropOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-[#2A6AFF] bg-[#2A6AFF]/10 backdrop-blur-[2px]">
    <div className="flex flex-col items-center gap-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2A6AFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line
          x1="12"
          y1="3"
          x2="12"
          y2="15"
        />
      </svg>
      <span className="text-[14px] font-medium text-[#2A6AFF]">
        파일을 여기에 놓으세요
      </span>
    </div>
  </div>
);
