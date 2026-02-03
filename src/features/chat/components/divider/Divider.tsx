import {
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/shared/components/icons/DividerIcons";

interface DividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export const Divider = ({ onMouseDown, isDragging }: DividerProps) => {
  return (
    <div className="relative z-10 flex w-0 items-center justify-center">
      {/* 드래그 핸들 버튼 - 경계선 중심에 떠있는 형태 */}
      <div
        onMouseDown={onMouseDown}
        className={`absolute flex h-[56px] w-[24px] cursor-col-resize flex-col items-center justify-center gap-[3px] rounded-[20px] border-[0.5px] border-[#D1D6DE] bg-white shadow-[4px_4px_15px_0px_rgba(0,0,0,0.1)] transition-all hover:scale-105 ${
          isDragging ? "scale-105" : ""
        }`}
      >
        <ArrowLeftIcon size={14} />
        <ArrowRightIcon size={14} />
      </div>
    </div>
  );
};
