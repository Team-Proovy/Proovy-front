/**
 * useNoteListPage - 노트 목록 페이지 상태 관리
 */

import { useEffect, useState } from "react";
import { useNoteList } from "./useNotes";
import type { SortOrder } from "../constants/sort_options";
import type { PageInfo } from "@/shared/api/shared_types";
import type { NoteDto } from "../api/notes_types";

const PAGE_SIZE = 6;
const FIRST_PAGE_VISIBLE_COUNT = 5;

export const useNoteListPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUsedAt,desc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // API 데이터 조회
  const firstPageQuery = useNoteList({
    page: 0,
    size: PAGE_SIZE,
    sort: sortOrder,
  });

  const apiTotalPages = firstPageQuery.data?.pageInfo.totalPages ?? 0;
  const totalElements = firstPageQuery.data?.pageInfo.totalElements ?? 0;

  const prevPageQuery = useNoteList({
    page: currentPage - 1,
    size: PAGE_SIZE,
    sort: sortOrder,
    enabled: currentPage >= 2,
  });

  const currentPageQuery = useNoteList({
    page: currentPage,
    size: PAGE_SIZE,
    sort: sortOrder,
    enabled: currentPage >= 1 && currentPage <= apiTotalPages - 1,
  });

  const isLoading =
    firstPageQuery.isLoading ||
    (currentPage >= 1 &&
      currentPage <= apiTotalPages - 1 &&
      currentPageQuery.isLoading) ||
    (currentPage >= 2 && prevPageQuery.isLoading);

  const isError =
    firstPageQuery.isError ||
    (currentPage >= 1 &&
      currentPage <= apiTotalPages - 1 &&
      currentPageQuery.isError) ||
    (currentPage >= 2 && prevPageQuery.isError);

  const getVirtualTotalPages = (totalNotes: number) => {
    if (totalNotes <= FIRST_PAGE_VISIBLE_COUNT) {
      return 1;
    }

    return 1 + Math.ceil((totalNotes - FIRST_PAGE_VISIBLE_COUNT) / PAGE_SIZE);
  };

  const virtualTotalPages = getVirtualTotalPages(totalElements);

  const pageInfo: PageInfo | undefined = firstPageQuery.data?.pageInfo
    ? {
        page: currentPage,
        size: PAGE_SIZE,
        totalElements,
        totalPages: virtualTotalPages,
        hasNext: currentPage < virtualTotalPages - 1,
        hasPrevious: currentPage > 0,
      }
    : undefined;

  const firstPageNotes = firstPageQuery.data?.notes ?? [];
  let notes: NoteDto[] = [];

  if (currentPage === 0) {
    notes = firstPageNotes.slice(0, FIRST_PAGE_VISIBLE_COUNT);
  } else {
    const prevNotes =
      currentPage === 1 ? firstPageNotes : (prevPageQuery.data?.notes ?? []);
    const currentNotes =
      currentPage <= apiTotalPages - 1
        ? (currentPageQuery.data?.notes ?? [])
        : [];

    notes = [
      ...prevNotes.slice(-1),
      ...currentNotes.slice(0, FIRST_PAGE_VISIBLE_COUNT),
    ];
  }

  useEffect(() => {
    if (!firstPageQuery.data?.pageInfo) return;

    const lastPageIndex = Math.max(virtualTotalPages - 1, 0);
    if (currentPage > lastPageIndex) {
      setCurrentPage(lastPageIndex);
    }
  }, [currentPage, firstPageQuery.data?.pageInfo, virtualTotalPages]);

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

  const handleEnterSelectMode = () => {
    if (!isSelectMode) {
      toggleSelectMode();
    }
  };

  const handleCancelSelectMode = () => {
    if (isSelectMode) {
      toggleSelectMode();
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.length > 0) {
      setIsDeleteModalOpen(true);
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
  };
};
