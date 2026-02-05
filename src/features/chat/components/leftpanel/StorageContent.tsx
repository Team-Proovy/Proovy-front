import { useState } from "react";
import { StorageActionButtons } from "./StorageActionButtons";
import { NoteCard } from "@/features/storage/components/NoteCard";
import { StorageChevronIcon } from "@/shared/components/icons/StorageIcons";

interface StorageContentProps {
  noteId: string;
}

export const StorageContent = ({ noteId: _noteId }: StorageContentProps) => {
  // TODO: 실제 파일 목록 API 연결 (noteId 사용 예정)
  const mockFiles = [
    { id: 1, label: "discrete_math_HW2.pdf", type: "업로드" as const },
    {
      id: 2,
      label: "더미 파일 1",
      type: "AI 생성" as const,
    },
    {
      id: 3,
      label: "더미 파일 2",
      type: "AI 생성" as const,
    },
    {
      id: 4,
      label: "더미 파일 3",
      type: "AI 생성" as const,
    },
    {
      id: 5,
      label: "더미 파일 4",
      type: "AI 생성" as const,
    },
  ];

  const [isBoxOpen, setIsBoxOpen] = useState(true);
  const [isThreadOpen, setIsThreadOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectMode] = useState(false);

  const toggleIdSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 - 용량 표시 (shrink-0) */}
      <div className="flex shrink-0 items-center justify-end gap-[10px] border-b px-4 py-3">
        <span className="text-sm font-medium text-black">노트 용량</span>
        <div className="flex h-[5px] w-[75px] overflow-hidden rounded-[10px] border-[0.5px] border-[#C6C6C6] bg-white">
          <div
            className="h-full bg-[#2A6AFF]"
            style={{ width: "48%" }}
          />
        </div>
        <span className="text-[13px] text-black">240/500MB</span>
      </div>

      {/* 콘텐츠 영역 (flex-1, min-w-0, overflow-hidden) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          <button
            onClick={() => setIsBoxOpen(!isBoxOpen)}
            className="mb-3 flex w-full items-center gap-2"
          >
            <StorageChevronIcon isOpen={isBoxOpen} />
            <span className="text-[15px] font-medium text-black">BOX</span>
          </button>

          {/* 저장소 NoteCard 재사용 */}
          {isBoxOpen && (
            <div className="mb-6 grid grid-cols-[repeat(auto-fill,240px)] gap-5">
              {mockFiles.map((file) => (
                <NoteCard
                  key={file.id}
                  label={file.label}
                  type={file.type}
                  isSelected={selectedIds.includes(file.id)}
                  isSelectMode={isSelectMode}
                  onSelect={() => toggleIdSelection(file.id)}
                />
              ))}
            </div>
          )}

          {/* THREAD 섹션 */}
          <button
            onClick={() => setIsThreadOpen(!isThreadOpen)}
            className="mb-3 flex w-full items-center gap-2"
          >
            <StorageChevronIcon isOpen={isThreadOpen} />
            <span className="text-[15px] font-medium text-black">THREAD</span>
          </button>

          {isThreadOpen && (
            <div className="grid grid-cols-[repeat(auto-fill,240px)] gap-5">
              <NoteCard
                label="THREAD 1번"
                type="AI 생성"
                isSelected={false}
                isSelectMode={false}
                onSelect={() => {}}
              />
            </div>
          )}

          {/* 스크롤 여유 공간 */}
          <div className="h-[40px] shrink-0" />
        </div>

        {/* 하단 버튼 (shrink-0) */}
        <div className="flex shrink-0 justify-center px-[16px] pb-[20px]">
          <StorageActionButtons
            onOpenViewer={() => {
              // TODO: 뷰어에서 열기 기능 구현
              console.log("뷰어에서 열기");
            }}
            onDelete={() => {
              // TODO: 삭제하기 기능 구현
              console.log("삭제하기");
            }}
          />
        </div>
      </div>
    </div>
  );
};
