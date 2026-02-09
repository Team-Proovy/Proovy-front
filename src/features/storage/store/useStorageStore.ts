import { create } from "zustand";

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
  deleteSelectedNotes: () => void;
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
  deleteSelectedNotes: () =>
    set((state) => ({
      noteCards: state.noteCards.filter(
        (note) => !state.selectedIds.includes(note.id),
      ),
      selectedIds: [],
      isSelectMode: false,
      isDeleteModalOpen: false,
      isSuccessModalOpen: true,
    })),
}));
