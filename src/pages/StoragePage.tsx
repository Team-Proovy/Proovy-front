/**
 * StoragePage - 저장소 페이지
 *
 * URL: /app/storage
 *
 * 기능:
 * - 노트별 파일 그룹 표시
 * - 파일 선택/삭제
 * - 용량 정보 표시
 */

import { useState } from "react";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import { StorageToolbar } from "@/features/storage/components/StorageToolbar";
import { NoteGroup } from "@/features/storage/components/NoteGroup";
import { DeleteNotesModal } from "@/features/storage/components/DeleteNotesModal";
import { DeletionSuccessModal } from "@/features/storage/components/DeletionSuccessModal";
import { useStorageInfo } from "@/features/storage/hooks/useAssets";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageContainer } from "@/shared/layout/PageContainer";

const getNearCapacityMessage = (planType?: string) => {
  const normalized = (planType ?? "").toLowerCase();
  if (normalized === "free") {
    return "저장소가 거의 가득 찼습니다. Standard 플랜으로 업그레이드하세요!";
  }
  if (normalized === "standard") {
    return "저장소가 거의 가득 찼습니다. Pro 플랜으로 업그레이드하세요!";
  }
  return "저장소가 거의 가득 찼습니다. 파일을 삭제하여 공간을 확보하세요!";
};

type ToggleTab = "upload" | "create";

export const StoragePage = () => {
  const [keyword, setKeyword] = useState("");
  const [openNoteIds, setOpenNoteIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<ToggleTab>("upload");

  const { isDeleteModalOpen, isSuccessModalOpen } = useStorageStore();

  const { data, isLoading, error } = useStorageInfo(keyword);

  const handleToggle = (noteId: number) => {
    setOpenNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId],
    );
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
  };

  const showNearCapacityWarning = (data?.usagePercent ?? 0) >= 90;
  const nearCapacityMessage = getNearCapacityMessage(data?.plan?.planType);

  return (
    <>
      <PageContainer>
        <h1 className="mb-[23px] font-['Pretendard'] text-[40px] leading-[52px] font-semibold text-black">
          저장소
        </h1>

        <StorageToolbar
          usagePercent={data?.usagePercent ?? 0}
          totalUsedDisplay={data?.totalUsedDisplay ?? "0MB"}
          totalLimitDisplay={data?.totalLimitDisplay ?? "0MB"}
          onSearch={handleSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-[24px] flex flex-col gap-[20px]">
          {isLoading ? (
            <p>데이터를 불러오는 중입니다...</p>
          ) : error ? (
            <p className="text-red-500">
              데이터를 불러오는 중 오류가 발생했습니다.
            </p>
          ) : data?.notes && data.notes.length > 0 ? (
            data.notes.map((note) => (
              <NoteGroup
                key={note.noteId}
                title={note.title}
                storageUsedDisplay={note.storageUsedDisplay}
                storageLimitDisplay={note.storageLimitDisplay}
                usagePercent={Math.min(
                  (note.storageUsed / note.storageLimit) * 100,
                  100,
                )}
                notes={note.assets}
                isOpen={openNoteIds.includes(note.noteId)}
                onToggle={() => handleToggle(note.noteId)}
              />
            ))
          ) : (
            <EmptyState
              message="업로드된 파일이 없습니다"
              description="새로운 파일을 업로드하여 저장소를 채워보세요."
            />
          )}
        </div>

        {showNearCapacityWarning && (
          <p className="mt-6 font-['Pretendard'] text-[14px] font-medium text-[#FF3B30]">
            {nearCapacityMessage}
          </p>
        )}
      </PageContainer>
      {isDeleteModalOpen && <DeleteNotesModal />}
      {isSuccessModalOpen && <DeletionSuccessModal />}
    </>
  );
};
