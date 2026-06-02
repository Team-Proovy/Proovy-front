import { StorageChevronIcon } from "../../../shared/components/icons/StorageIcons";
import { NoteCard } from "./NoteCard";
import { useStorageStore } from "../store/useStorageStore";
import type { AssetSummaryDto } from "../api/assets_types";
import {
  mapAssetSource,
  mapAssetCategory,
  mapOcrStatus,
} from "../utils/asset-mapper";
import { ContentGrid } from "@/shared/layout/ContentGrid";

interface NoteGroupProps {
  title: string;
  storageUsedDisplay: string;
  storageLimitDisplay: string;
  usagePercent: number;
  notes: AssetSummaryDto[];
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
    <div className="flex w-full flex-col">
      <button
        onClick={onToggle}
        className="mx-auto flex w-full cursor-pointer items-center justify-between rounded-[12px] border border-[#D1D6DE] bg-[#F1F4F8] px-[20px] py-[8px] transition-colors"
        style={{
          display: "flex",
          height: "40px",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center">
          <StorageChevronIcon isOpen={isOpen} />
          <span
            className="ml-[28px] font-['Pretendard']"
            style={{
              color: "#000",
              fontSize: "15px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "22px",
              letterSpacing: "-0.001px",
            }}
          >
            {title}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-['Pretendard']">
          <span
            style={{
              color: "#000",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "20px",
            }}
          >
            노트 용량
          </span>
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
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <span className="w-22.5 text-[13px] font-normal text-black">
            {storageUsedDisplay.replace("MB", "")}/{storageLimitDisplay}
          </span>
        </div>
      </button>

      {isOpen &&
        (notes.length > 0 ? (
          <ContentGrid
            className="mt-3"
            gapClass="gap-[40px]"
            cols={{ base: 2, xl: 3, xl3: 4 }}
          >
            {notes.map((asset) => (
              <NoteCard
                key={asset.assetId}
                id={asset.assetId}
                label={asset.fileName}
                type={mapAssetSource(asset.source)}
                thumbnailUrl={asset.thumbnailUrl}
                mimeType={asset.mimeType}
                fileCategory={mapAssetCategory(asset.fileCategory)}
                ocrStatus={mapOcrStatus(asset.ocrStatus)}
                isSelected={selectedIds.includes(asset.assetId)}
                isSelectMode={isSelectMode}
                onSelect={() => toggleIdSelection(asset.assetId)}
              />
            ))}
          </ContentGrid>
        ) : (
          <div className="mx-auto mt-[12px] flex h-[60px] w-full items-center justify-center rounded-[12px] border border-[#E0E0E0] bg-white">
            <span className="font-['Pretendard'] text-[13px] font-medium text-[#AEAEAE]">
              저장된 파일이 없습니다.
            </span>
          </div>
        ))}
    </div>
  );
};
