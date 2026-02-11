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
import {
  NotesHeader,
  NotesGrid,
  NotesPagination,
  DeleteNotesModal,
  DeletionSuccessModal,
} from "../components";

export const NotesPage = () => {
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
    handleActionClick,
    handlePreviousPage,
    handleNextPage,
    setCurrentPage,
    setIsSortDropdownOpen,
    handleCloseDeleteModal,
    handleDeleteSuccess,
    handleCloseSuccessModal,
  } = useNoteListPage();

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
    <div className="flex h-full w-full flex-col overflow-auto bg-white">
      <div className="mx-auto flex w-full flex-1 flex-col px-20">
        <div className="mx-auto my-auto w-[582px] min-[1340px]:w-[893px]">
          {/* 헤더 영역 */}
          <NotesHeader
            sortOrder={sortOrder}
            isSortDropdownOpen={isSortDropdownOpen}
            isSelectMode={isSelectMode}
            notesCount={notes.length}
            totalElements={pageInfo?.totalElements || 0}
            selectedCount={selectedIds.length}
            onSelectSort={handleSelectSort}
            onToggleSortDropdown={setIsSortDropdownOpen}
            onActionClick={handleActionClick}
          />

          {/* 노트 그리드 영역 */}
          <div>
            <NotesGrid
              notes={notes}
              isLoading={isLoading}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleIdSelection}
            />
          </div>

          {/* 페이지네이션 */}
          <NotesPagination
            pageInfo={pageInfo}
            currentPage={currentPage}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
            onPageChange={setCurrentPage}
          />
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
