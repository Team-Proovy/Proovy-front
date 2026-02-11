import { create } from "zustand";
import { deleteAssets } from "@/features/assets/api/assetApi";

export interface Note {
  id: number;
  label: string;
  type: "upload" | "ai";
  fileUrl?: string;
  mimeType?: string;
  ocrStatus?: "pending" | "processing" | "completed" | "failed";
}

interface StorageState {
  isSelectMode: boolean;
  selectedIds: number[];
  isDeleteModalOpen: boolean;
  isSuccessModalOpen: boolean;
  noteCards: Note[];

  setSelectMode: (isSelectMode: boolean) => void;
  toggleSelectMode: () => void;
  setSelectedIds: (ids: number[]) => void;
  toggleIdSelection: (id: number) => void;

  setDeleteModalOpen: (isOpen: boolean) => void;
  setSuccessModalOpen: (isOpen: boolean) => void;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  deleteSelectedNotes: () => Promise<void>;

  viewerFileId: number | null;
  setViewerFileId: (id: number | null) => void;
}

export const useStorageStore = create<StorageState>((set) => ({
  isSelectMode: false,
  selectedIds: [],
  isDeleteModalOpen: false,
  isSuccessModalOpen: false,
  noteCards: [],

  setSelectMode: (isSelectMode) => set({ isSelectMode }),
  toggleSelectMode: () => {
    set((state) => {
      const nextSelectMode = !state.isSelectMode;
      return {
        isSelectMode: nextSelectMode,
        selectedIds: nextSelectMode ? state.selectedIds : [],
      };
    });
  },
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  toggleIdSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id],
    })),

  setDeleteModalOpen: (isDeleteModalOpen) => set({ isDeleteModalOpen }),
  setSuccessModalOpen: (isSuccessModalOpen) => set({ isSuccessModalOpen }),
  setNotes: (noteCards) => set({ noteCards }),
  addNote: (note) =>
    set((state) => ({ noteCards: [note, ...state.noteCards] })),
  deleteSelectedNotes: async () => {
    const state = useStorageStore.getState();
    const { selectedIds } = state;

    if (selectedIds.length === 0) return;

    try {
      // 실제 API 호출
      await deleteAssets(selectedIds);

      // 성공 시 상태 업데이트
      set({
        noteCards: state.noteCards.filter(
          (note) => !selectedIds.includes(note.id),
        ),
        selectedIds: [],
        isSelectMode: false,
        isDeleteModalOpen: false,
        isSuccessModalOpen: true,
      });
    } catch (error) {
      console.error("파일 삭제 실패:", error);
      alert("파일 삭제에 실패했습니다.");
      set({ isDeleteModalOpen: false });
    }
  },

  viewerFileId: null,
  setViewerFileId: (id) => set({ viewerFileId: id }),
}));
