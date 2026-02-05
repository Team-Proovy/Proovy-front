import { create } from "zustand";

interface Note {
  id: number;
  label: string;
  type: "업로드";
}

interface StorageState {
  isSelectMode: boolean;
  selectedIds: number[];
  isNoteGroupOpen: boolean;
  isNoteGroup2Open: boolean;
  isDeleteModalOpen: boolean;
  isSuccessModalOpen: boolean;
  noteCards: Note[];

  setSelectMode: (isSelectMode: boolean) => void;
  toggleSelectMode: () => void;
  setSelectedIds: (ids: number[]) => void;
  toggleIdSelection: (id: number) => void;
  setNoteGroupOpen: (isOpen: boolean) => void;
  setNoteGroup2Open: (isOpen: boolean) => void;

  setDeleteModalOpen: (isOpen: boolean) => void;
  setSuccessModalOpen: (isOpen: boolean) => void;
  addNote: (note: Note) => void;
  deleteSelectedNotes: () => void;
}

const TEMPLATE_NOTES = [
  { label: "file_name.py", type: "업로드" as const },
  {
    label: "파일 가능.pdf",
    type: "업로드" as const,
    // fileUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf", // 테스트용 URL 제거
    mimeType: "application/pdf",
  },
  { label: "file_name.py", type: "업로드" as const },
  { label: "LLM 생성 파일", type: "업로드" as const },
  { label: "file_name.py", type: "업로드" as const },
  { label: "file_name.py", type: "업로드" as const },
  { label: "파일 가능.pdf", type: "업로드" as const },
  { label: "file_name.py", type: "업로드" as const },
  { label: "LLM 생성 파일", type: "업로드" as const },
  { label: "file_name.py", type: "업로드" as const },
];

const INITIAL_NOTES: Note[] = [
  ...TEMPLATE_NOTES.map((note, idx) => ({ ...note, id: idx })),
  ...TEMPLATE_NOTES.map((note, idx) => ({ ...note, id: idx + 10 })),
];

export const useStorageStore = create<StorageState>((set) => ({
  isSelectMode: false,
  selectedIds: [],
  isNoteGroupOpen: true,
  isNoteGroup2Open: true,
  isDeleteModalOpen: false,
  isSuccessModalOpen: false,
  noteCards: INITIAL_NOTES,

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
  setNoteGroupOpen: (isNoteGroupOpen) => set({ isNoteGroupOpen }),
  setNoteGroup2Open: (isNoteGroup2Open) => set({ isNoteGroup2Open }),

  setDeleteModalOpen: (isDeleteModalOpen) => set({ isDeleteModalOpen }),
  setSuccessModalOpen: (isSuccessModalOpen) => set({ isSuccessModalOpen }),
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
