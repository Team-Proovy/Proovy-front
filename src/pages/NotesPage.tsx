import { useNoteListPage } from "@/features/notes/hooks";
import { useMyProfile } from "@/features/settings/hooks/useUser";
import { getPlanMaxNotes } from "@/features/subscription/types/plan_types";
import {
  NotesHeader,
  NotesGrid,
  NotesPagination,
  DeleteNotesModal,
  DeletionSuccessModal,
} from "@/features/notes/components";
import { PageContainer } from "@/shared/layout/PageContainer";

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
    <PageContainer>
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
    </PageContainer>
  );
};
