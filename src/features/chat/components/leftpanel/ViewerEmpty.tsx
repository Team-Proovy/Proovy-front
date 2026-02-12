import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";

interface ViewerEmptyProps {
  onOpenFileExplorer: () => void;
}

export const ViewerEmpty = ({ onOpenFileExplorer }: ViewerEmptyProps) => {
  return (
    <div
      onClick={onOpenFileExplorer}
      className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-[16px] text-center transition-colors hover:text-[#2542F0]"
    >
      <div className="flex h-[56px] w-[56px] items-center justify-center">
        <PdfIcon size={56} />
      </div>
      <p className="text-[18px] font-normal whitespace-pre-line text-[#666666] transition-colors hover:text-[#2542F0]">
        파일이 비어있습니다.{"\n"}
        파일을 끌어오거나 클릭해서 추가해 주세요!
      </p>
    </div>
  );
};
