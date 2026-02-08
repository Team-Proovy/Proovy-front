import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StorageActionButtons } from "./StorageActionButtons";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { DeleteSuccessModal } from "./DeleteSuccessModal";
import { NoteCard } from "@/features/storage/components/NoteCard";
import { deleteAssets } from "@/features/assets/api/assetApi";
import type { PanelTab } from "./types";

interface MockFile {
  id: number;
  label: string;
  type: "upload" | "ai";
  fileUrl?: string;
  mimeType?: string;
  ocrStatus?: "pending" | "processing" | "completed" | "failed";
}

interface StorageContentProps {
  noteId: string;
  onTabChange: (tab: PanelTab) => void;
}

export const StorageContent = ({
  noteId: _noteId,
  onTabChange,
}: StorageContentProps) => {
  // TODO: 실제 파일 목록 API 연결 (noteId 사용 예정)
  const [boxFiles, setBoxFiles] = useState<MockFile[]>([
    {
      id: 1,
      label: "discrete_math_HW2.pdf",
      type: "upload",
      fileUrl:
        "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
      mimeType: "application/pdf",
      ocrStatus: "completed",
    },
    { id: 2, label: "더미 파일 1", type: "ai", ocrStatus: "completed" },
    { id: 3, label: "더미 파일 2", type: "ai", ocrStatus: "completed" },
    { id: 4, label: "더미 파일 3", type: "ai", ocrStatus: "completed" },
    { id: 5, label: "더미 파일 4", type: "ai", ocrStatus: "completed" },
  ]);

  const [threadFiles, setThreadFiles] = useState<MockFile[]>([
    { id: 100, label: "THREAD 1번", type: "ai", ocrStatus: "completed" },
  ]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const toggleIdSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectToggle = () => {
    if (isSelectMode) {
      setSelectedIds([]);
    }
    setIsSelectMode((prev) => !prev);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const response = await deleteAssets(selectedIds);

      if (response.isSuccess) {
        setBoxFiles((prev) =>
          prev.filter((file) => !selectedIds.includes(file.id)),
        );
        setThreadFiles((prev) =>
          prev.filter((file) => !selectedIds.includes(file.id)),
        );

        setSelectedIds([]);
        setIsDeleteModalOpen(false);
        setIsSelectMode(false);
        setIsSuccessModalOpen(true);
      } else {
        console.error("파일 삭제 실패:", response.message);
        alert("파일 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("파일 삭제 중 오류 발생:", error);
      alert("파일 삭제 중 오류가 발생했습니다.");
    }
  };

  const [, setSearchParams] = useSearchParams();

  const handleOpenViewer = () => {
    if (selectedIds.length === 0) {
      onTabChange("viewer");
      return;
    }

    const targetFileId = selectedIds[0];

    setSearchParams((prev) => {
      prev.set("panel", "viewer");
      prev.set("file", targetFileId.toString());
      return prev;
    });

    setSelectedIds([]);
    setIsSelectMode(false);
  };

  const handleFileClick = (fileId: number) => {
    if (isSelectMode) return;
    setSearchParams((prev) => {
      prev.set("panel", "viewer");
      prev.set("file", fileId.toString());
      return prev;
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* 헤더: BOX | 선택 버튼 | 노트 용량 (한 줄) */}
      <div className="flex shrink-0 items-center border-b border-[#D1D6DE] px-6 py-3">
        {/* 선택 버튼 */}
        <button
          onClick={handleSelectToggle}
          className={`flex items-center justify-center rounded-[12px] border-[0.5px] text-[14px] font-medium transition-all hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white ${
            isSelectMode
              ? "border-[#2A6AFF] bg-[#2A6AFF] text-white"
              : "border-[#D1D6DE] bg-white text-[#9CA4B0]"
          }`}
          style={{
            width: "56px",
            height: "32px",
          }}
        >
          {isSelectMode ? "취소" : "선택"}
        </button>

        {/* 노트 용량 - 오른쪽 정렬 */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[14px] font-medium text-black">노트 용량</span>
          <div className="flex h-[5px] w-[60px] overflow-hidden rounded-full border-[0.5px] border-[#D1D6DE] bg-white">
            <div
              className="h-full bg-[#2A6AFF]"
              style={{ width: "48%" }}
            />
          </div>
          <span className="text-[13px] font-normal text-black">240/500MB</span>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {/* BOX 라벨 */}
          <div className="mb-3">
            <span className="text-[18px] font-semibold text-black">BOX</span>
          </div>

          {/* BOX 파일 목록 */}
          <div className="mb-[40px] grid grid-cols-[repeat(auto-fill,240px)] gap-5">
            {boxFiles.map((file) => (
              <NoteCard
                key={file.id}
                label={file.label}
                type={file.type}
                fileUrl={file.fileUrl}
                mimeType={file.mimeType}
                ocrStatus={file.ocrStatus}
                isSelected={selectedIds.includes(file.id)}
                isSelectMode={isSelectMode}
                onSelect={() => toggleIdSelection(file.id)}
                onClick={() => handleFileClick(file.id)}
              />
            ))}
          </div>

          {/* THREAD 섹션 */}
          <div className="mb-3">
            <span className="text-[18px] font-semibold text-black">THREAD</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,240px)] gap-5">
            {threadFiles.map((file) => (
              <NoteCard
                key={file.id}
                label={file.label}
                type={file.type}
                fileUrl={file.fileUrl}
                mimeType={file.mimeType}
                ocrStatus={file.ocrStatus}
                isSelected={selectedIds.includes(file.id)}
                isSelectMode={isSelectMode}
                onSelect={() => toggleIdSelection(file.id)}
                onClick={() => handleFileClick(file.id)}
              />
            ))}
          </div>

          {/* 스크롤 여유 공간 */}
          <div className="h-10 shrink-0" />
        </div>

        {/* 하단 버튼 - 선택 모드일 때만 표시 */}
        {isSelectMode && (
          <div className="flex shrink-0 justify-center px-4 pb-5">
            <StorageActionButtons
              onOpenViewer={handleOpenViewer}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          selectedCount={selectedIds.length}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* 삭제 완료 모달 */}
      {isSuccessModalOpen && (
        <DeleteSuccessModal onClose={() => setIsSuccessModalOpen(false)} />
      )}
    </div>
  );
};
