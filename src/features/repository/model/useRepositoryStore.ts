import { create } from "zustand";

interface RepositoryState {
  isSelectMode: boolean;
  selectedIds: number[];
  isNoteGroupOpen: boolean;
  isNoteGroup2Open: boolean;
  setSelectMode: (isSelectMode: boolean) => void;
  toggleSelectMode: () => void;
  setSelectedIds: (ids: number[]) => void;
  toggleIdSelection: (id: number) => void;
  setNoteGroupOpen: (isOpen: boolean) => void;
  setNoteGroup2Open: (isOpen: boolean) => void;
}

export const useRepositoryStore = create<RepositoryState>((set) => ({
  isSelectMode: false,
  selectedIds: [],
  isNoteGroupOpen: true,
  isNoteGroup2Open: true,
  setSelectMode: (isSelectMode) => set({ isSelectMode }),
  toggleSelectMode: () =>
    set((state) => ({ isSelectMode: !state.isSelectMode })),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  toggleIdSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id],
    })),
  setNoteGroupOpen: (isNoteGroupOpen) => set({ isNoteGroupOpen }),
  setNoteGroup2Open: (isNoteGroup2Open) => set({ isNoteGroup2Open }),
}));
