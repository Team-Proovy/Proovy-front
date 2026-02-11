import {
  ViewerOpenIcon,
  TrashIcon,
} from "@/shared/components/icons/StorageActionIcons";

interface StorageActionButtonsProps {
  onOpenViewer: () => void;
  onDelete: () => void;
  selectedCount: number;
}

export const StorageActionButtons = ({
  onOpenViewer,
  onDelete,
  selectedCount,
}: StorageActionButtonsProps) => {
  const showViewer = selectedCount === 1;

  return (
    <div className={`flex h-[56px] shrink-0 items-center justify-center gap-4 rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white py-[14px] shadow-[4px_4px_20px_0px_rgba(0,0,0,0.1)] ${showViewer ? 'w-[350px]' : 'w-[140px]'}`}>
      {/* 뷰어에서 열기 버튼 - 1개만 선택했을 때만 표시 */}
      {showViewer && (
        <button
          onClick={onOpenViewer}
          type="button"
          className="flex h-[28px] w-[140px] shrink-0 items-center justify-center gap-1 rounded-lg bg-[#2A6AFF] text-base leading-6 text-white transition-colors hover:bg-[#2259DB]"
        >
          <ViewerOpenIcon size={24} />
          <span className="whitespace-nowrap">뷰어에서 열기</span>
        </button>
      )}

      {/* 삭제하기 버튼 */}
      <button
        onClick={onDelete}
        type="button"
        className="flex h-[28px] w-[108px] shrink-0 items-center justify-center gap-1 rounded-lg border border-[#D1D6DE] text-base leading-6 text-black transition-colors hover:bg-gray-50"
      >
        <TrashIcon size={20} />
        <span className="whitespace-nowrap">삭제하기</span>
      </button>
    </div>
  );
};
