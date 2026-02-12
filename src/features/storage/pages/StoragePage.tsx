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
import { useStorageStore } from "../store/useStorageStore";
import { StorageToolbar } from "../components/StorageToolbar";
import { NoteGroup } from "../components/NoteGroup";
import { DeleteNotesModal } from "../components/DeleteNotesModal";
import { DeletionSuccessModal } from "../components/DeletionSuccessModal";
import { useStorageInfo } from "../hooks/useAssets";

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

export const StoragePage = () => {
  const [keyword, setKeyword] = useState("");
  const [openNoteIds, setOpenNoteIds] = useState<number[]>([]);

  const { isDeleteModalOpen, isSuccessModalOpen } = useStorageStore();

  // API를 통한 스토리지 정보 조회
  const { data, isLoading, error } = useStorageInfo(keyword);

  // 노트 그룹 토글 핸들러
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
      <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
        <div className="mx-auto w-full max-w-[1680px]">
          {/* Header Section */}
          <div className="mb-[23px] flex justify-center">
            <div className="3xl:max-w-[1360px] w-full max-w-[520px] lg:max-w-[800px] 2xl:max-w-[1080px]">
              <h1 className="font-['Pretendard'] text-[40px] leading-[52px] font-semibold text-black">
                저장소
              </h1>
            </div>
          </div>

          {/* Toolbar Row */}
          <div className="flex justify-center">
            <StorageToolbar
              usagePercent={data?.usagePercent ?? 0}
              totalUsedDisplay={data?.totalUsedDisplay ?? "0MB"}
              totalLimitDisplay={data?.totalLimitDisplay ?? "0MB"}
              onSearch={handleSearch}
            />
          </div>

          {/* Note Groups Section */}
          <div className="mt-[24px] flex flex-col items-center justify-center gap-[20px]">
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
              <p className="text-gray-500">저장된 파일이 없습니다.</p>
            )}
          </div>

          {showNearCapacityWarning && (
            <div className="mt-6 flex justify-center">
              <p className="font-['Pretendard'] text-[14px] font-medium text-[#FF3B30]">
                {nearCapacityMessage}
              </p>
            </div>
          )}
        </div>
      </div>
      {isDeleteModalOpen && <DeleteNotesModal />}
      {isSuccessModalOpen && <DeletionSuccessModal />}
    </>
  );
};
