/**
 * useNoteListPage - 노트 목록 페이지 상태 관리
 */

import { useState } from "react";
import { useNoteList } from "./useNotes";
import type { SortOrder } from "../constants/sort_options";

export const useNoteListPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUsedAt,desc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // API 데이터 조회
  const { data, isLoading, isError } = useNoteList({
    page: currentPage,
    size: 6,
    sort: sortOrder,
  });

  const notes = data?.notes || [];
  const pageInfo = data?.pageInfo;

  const handleSelectSort = (value: SortOrder) => {
    setSortOrder(value);
    setCurrentPage(0);
    setIsSortDropdownOpen(false);
  };

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleIdSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleActionClick = () => {
    if (isSelectMode) {
      if (selectedIds.length > 0) {
        setIsDeleteModalOpen(true);
      }
    } else {
      toggleSelectMode();
    }
  };

  const handlePreviousPage = () => {
    if (pageInfo?.hasPrevious) {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (pageInfo?.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setIsSuccessModalOpen(true);
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  return {
    // State
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
    // Actions
    handleSelectSort,
    toggleSelectMode,
    toggleIdSelection,
    handleActionClick,
    handlePreviousPage,
    handleNextPage,
    setCurrentPage,
    setIsSortDropdownOpen,
    handleCloseDeleteModal,
    handleDeleteSuccess,
    handleCloseSuccessModal,
  };
};
