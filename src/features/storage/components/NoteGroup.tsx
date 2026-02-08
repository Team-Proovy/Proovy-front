import { StorageChevronIcon } from "../../../shared/components/icons/StorageIcons";
import { NoteCard } from "./NoteCard";
import { useStorageStore } from "../store/useStorageStore";
import type { AssetDetailResponseData } from "@/features/assets/types/asset";
interface NoteGroupProps {
  title: string;
  storageUsedDisplay: string; // "240MB"
  storageLimitDisplay: string; // "500MB"
  usagePercent: number; // (storageUsed / storageLimit) * 100 계산값
  notes: AssetDetailResponseData[]; // 서버에서 온 실제 자산 배열
  isOpen: boolean;
  onToggle: () => void;
}

export const NoteGroup = ({
  title,
  storageUsedDisplay,
  storageLimitDisplay,
  usagePercent,
  notes,
  isOpen,
  onToggle,
}: NoteGroupProps) => {
  const { isSelectMode, selectedIds, toggleIdSelection } = useStorageStore();

  return (
    <div className="3xl:max-w-[1360px] mx-auto flex w-full max-w-[520px] flex-col lg:max-w-[800px] 2xl:max-w-[1080px]">
      <button
        onClick={onToggle}
        className="mx-auto flex w-full items-center justify-between rounded-[12px] border border-[#D1D6DE] bg-[#F1F4F8] px-[20px] py-[8px] transition-colors"
        style={{
          display: "flex",
          height: "40px",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center">
          <StorageChevronIcon isOpen={isOpen} />
          <span className="ml-[28px] font-['Pretendard'] text-[15px] font-medium text-black">
            {title}
          </span>
        </div>

        {/* 오른쪽 용량 정보 영역 */}
        <div className="flex items-center gap-[10px] font-['Pretendard']">
          <span className="text-[14px] font-medium text-black">노트 용량</span>

          {/* 동적 막대 그래프 */}
          <div
            style={{
              display: "flex",
              width: "75px",
              height: "5px",
              borderRadius: "10px",
              border: "0.5px solid #C6C6C6",
              background: "#FFF",
              overflow: "hidden",
            }}
          >
            <div
              className="h-full bg-[#2A6AFF]"
              style={{ width: `${usagePercent}%` }} // 계산된 퍼센트 적용
            />
          </div>

          {/* 서버 데이터 기반 텍스트 (예: 240/500MB)  */}
          <span className="text-[13px] font-normal text-black">
            {storageUsedDisplay.replace("MB", "")}/{storageLimitDisplay}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="3xl:grid-cols-5 mx-auto mt-[20px] grid w-full grid-cols-2 justify-center gap-x-[40px] gap-y-[20px] lg:grid-cols-3 2xl:grid-cols-4">
          {notes.map((asset) => {
            return (
              <NoteCard
                key={asset.assetId} // 고유 ID 사용
                label={asset.fileName} // 파일명
                type={asset.source === "upload" ? "upload" : "ai"} // 출처 매핑
                fileUrl={asset.thumbnailUrl || undefined} // 썸네일 URL
                mimeType={asset.mimeType} // MIME 타입
                ocrStatus={asset.ocrStatus} // OCR 상태
                isSelected={selectedIds.includes(asset.assetId)}
                isSelectMode={isSelectMode}
                onSelect={() => toggleIdSelection(asset.assetId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
