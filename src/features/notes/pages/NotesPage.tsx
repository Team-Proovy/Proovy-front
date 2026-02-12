/**
 * NotesPage - 노트 목록 페이지
 *
 * URL: /app/notes
 *
 * 기능:
 * - 전체 노트 목록 표시 (페이지네이션)
 * - 노트 카드 클릭 → /app/chat/:noteId 로 이동
 * - "노트 추가하기" 클릭 → /app/home 으로 이동
 */

import { useNoteListPage } from "../hooks";
import { useMyProfile } from "@/features/settings/hooks/useUser";
import { getPlanMaxNotes } from "@/features/subscription/types/plan_types";
import {
  NotesHeader,
  NotesGrid,
  NotesPagination,
  DeleteNotesModal,
  DeletionSuccessModal,
} from "../components";

export const NotesPage = () => {
  const { data: profile } = useMyProfile();
  const maxNotes = getPlanMaxNotes(profile?.subscription?.plan);
  const {
    currentPage,
    sortOrder,
    isSortDropdownOpen,
    isSelectMode,
    selectedIds,
    isDeleteModalOpen,
    isSuccessModalOpen,
    notes,
    pageInfo,
    isLoading,
    isError,
    handleSelectSort,
    toggleIdSelection,
    handleEnterSelectMode,
    handleCancelSelectMode,
    handleDeleteClick,
    handlePreviousPage,
    handleNextPage,
    setCurrentPage,
    setIsSortDropdownOpen,
    handleCloseDeleteModal,
    handleDeleteSuccess,
    handleCloseSuccessModal,
  } = useNoteListPage();

  const displayTotalElements = pageInfo?.totalElements ?? 0;

  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-[16px] leading-[20px] font-medium text-black">
            노트 목록을 불러올 수 없습니다.
          </p>
          <p className="mt-[8px] text-[14px] leading-[18px] text-[#6D6D6D]">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
      <div className="mx-auto w-full max-w-[1680px]">
        <div className="mb-[12px] flex justify-center">
          <div className="3xl:max-w-[1360px] w-full max-w-[520px] lg:max-w-[800px] 2xl:max-w-[1080px]">
            {/* 헤더 영역 */}
            <NotesHeader
              sortOrder={sortOrder}
              isSortDropdownOpen={isSortDropdownOpen}
              isSelectMode={isSelectMode}
              totalElements={displayTotalElements}
              maxNotes={maxNotes}
              selectedCount={selectedIds.length}
              onSelectSort={handleSelectSort}
              onToggleSortDropdown={setIsSortDropdownOpen}
              onEnterSelectMode={handleEnterSelectMode}
              onCancelSelectMode={handleCancelSelectMode}
              onDeleteClick={handleDeleteClick}
            />
          </div>
        </div>

        {/* 노트 그리드 + 페이지네이션 */}
        <div className="flex justify-center">
          <div className="w-[582px] min-[1340px]:w-[893px]">
            <NotesGrid
              notes={notes}
              isLoading={isLoading}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleIdSelection}
              showAddCard={currentPage === 0}
              totalSlots={6}
            />

            <NotesPagination
              pageInfo={pageInfo}
              currentPage={currentPage}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              onPageChange={setCurrentPage}
            />
            {/* <div className="min-h-[12vh]" /> */}
          </div>
        </div>
      </div>

      {/* 모달 영역 */}
      {isDeleteModalOpen && (
        <DeleteNotesModal
          selectedIds={selectedIds}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
        />
      )}
      {isSuccessModalOpen && (
        <DeletionSuccessModal onClose={handleCloseSuccessModal} />
      )}
    </div>
  );
};
