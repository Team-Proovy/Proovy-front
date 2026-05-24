import {
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/shared/components/icons/DividerIcons";

interface DividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  isDragging: boolean;
}

export const Divider = ({
  onMouseDown,
  onTouchStart,
  isDragging,
}: DividerProps) => {
  return (
    <div className="relative z-10 flex h-full w-0 items-center justify-center">
      {/* 세로 경계선 전체를 드래그 hit area로 사용 */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="group absolute inset-y-0 left-1/2 flex w-[24px] -translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
      >
        <div
          className={`flex h-[56px] w-[24px] flex-col items-center justify-center gap-[3px] rounded-[20px] border-[0.5px] border-[#D1D6DE] bg-white shadow-[4px_4px_15px_0px_rgba(0,0,0,0.1)] transition-all group-hover:scale-105 ${
            isDragging ? "scale-105" : ""
          }`}
        >
          <ArrowLeftIcon size={14} />
          <ArrowRightIcon size={14} />
        </div>
      </div>
    </div>
  );
};
