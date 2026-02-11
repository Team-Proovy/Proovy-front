import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { StorageActionButtons } from "./StorageActionButtons";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { DeleteSuccessModal } from "./DeleteSuccessModal";
import { NoteCard } from "@/features/storage/components/NoteCard";
import { deleteAssets } from "@/features/assets/api/assetApi";
import { useNoteDetail, noteKeys } from "@/features/notes/hooks/useNotes";
import type { PanelTab } from "./types";
import { useAuthStore } from "@/features/auth/store/auth_store";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import {
  PLAN_DETAILS,
  type PlanType,
} from "@/features/subscription/types/plan_types";

interface StorageFile {
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

const getMimeType = (fileType: string | undefined | null) => {
  if (!fileType) return undefined;
  const type = fileType.toLowerCase();

  if (type === "pdf") return "application/pdf";
  if (["png", "jpg", "jpeg", "webp"].includes(type))
    return `image/${type === "jpg" ? "jpeg" : type}`;
  if (type === "image") return "image/jpeg"; // generic fallback시 그냥 image/jpeg로 매핑

  return fileType;
};

export const StorageContent = ({
  noteId,
  onTabChange,
}: StorageContentProps) => {
  const queryClient = useQueryClient();
  const [hasProcessingAssets, setHasProcessingAssets] = useState(false);
  const { data: noteDetail } = useNoteDetail(noteId, undefined, {
    refetchInterval: hasProcessingAssets ? 3000 : false,
  });
  const { user } = useAuthStore();

  // OCR 처리 중인 에셋이 있으면 폴링 활성화
  useEffect(() => {
    const isProcessing =
      noteDetail?.assets?.some(
        (asset) =>
          asset.ocrStatus === "pending" || asset.ocrStatus === "processing",
      ) ?? false;
    setHasProcessingAssets(isProcessing);
  }, [noteDetail]);

  // BOX 파일 목록 (업로드된 자산)
  const boxFiles = useMemo<StorageFile[]>(() => {
    if (!noteDetail?.assets) return [];
    return noteDetail.assets.map((asset) => ({
      id: asset.assetId,
      label: asset.fileName,
      type: "upload",
      fileUrl: asset.thumbnailUrl ?? undefined,
      mimeType: getMimeType(asset.fileType), // fileType -> mimeType 변환 적용
      ocrStatus: asset.ocrStatus as StorageFile["ocrStatus"],
    }));
  }, [noteDetail]);

  // THREAD 파일 목록 (AI 생성 파일)
  const threadFiles = useMemo<StorageFile[]>(() => {
    if (!noteDetail?.conversations) return [];
    return noteDetail.conversations.flatMap((conv) =>
      conv.assistantMessage.generatedFiles.map((file) => ({
        id: file.fileId,
        label: file.fileName,
        type: "ai",
        fileUrl: file.downloadUrl,
        mimeType: getMimeType(file.fileType), // fileType -> mimeType 변환 적용
        ocrStatus: "completed", // 생성된 파일은 OCR 완료 상태로 간주
      })),
    );
  }, [noteDetail]);

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

    // BOX 파일(upload 타입)만 필터링하여 삭제 대상 설정
    // THREAD 파일은 삭제 대상에서 제외
    const targetIds = selectedIds.filter((id) =>
      boxFiles.some((file) => file.id === id),
    );

    if (targetIds.length === 0) {
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      const response = await deleteAssets(targetIds);

      if (response.isSuccess) {
        // 성공 시 쿼리 무효화하여 목록 갱신
        queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) });

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

  /* user duplicated declaration removed */
  const { setViewerFileId } = useStorageStore();
  const [, setSearchParams] = useSearchParams();

  const handleOpenViewer = () => {
    if (selectedIds.length === 0) {
      onTabChange("viewer");
      return;
    }

    const targetFileId = selectedIds[0];
    setViewerFileId(targetFileId);

    setSearchParams((prev) => {
      prev.set("panel", "viewer");
      prev.set("file", targetFileId.toString());
      return prev;
    });

    setSelectedIds([]);
    setIsSelectMode(false);
    onTabChange("viewer");
  };

  const handleFileClick = (fileId: number) => {
    if (isSelectMode) return;
    setViewerFileId(fileId);
    setSearchParams((prev) => {
      prev.set("panel", "viewer");
      prev.set("file", fileId.toString());
      return prev;
    });
    onTabChange("viewer");
  };

  // 용량 계산 (MB 단위) -> 사용자 플랜에 따른 스토리지 한도 계산
  const userPlan = (user?.plan as PlanType) || "Free";
  const planStorageLimit = PLAN_DETAILS[userPlan]?.storage || "5GB";

  // GB -> MB 변환
  const totalLimitMB = planStorageLimit.includes("GB")
    ? parseInt(planStorageLimit.replace("GB", "")) * 1024
    : parseInt(planStorageLimit.replace("MB", "")) || 500;

  const usedBytes =
    noteDetail?.assets?.reduce((acc, asset) => acc + asset.fileSize, 0) ?? 0;

  const usedMB = usedBytes / 1024 / 1024;

  const usageRatio = usedMB / totalLimitMB;
  const isOverLimit = usageRatio > 0.9;

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
              className={`h-full ${isOverLimit ? "bg-[#FF3B30]" : "bg-[#2A6AFF]"}`}
              style={{
                width: `${Math.min(usageRatio * 100, 100)}%`,
              }}
            />
          </div>
          <span className="text-[13px] font-normal text-black">
            {usedMB.toFixed(2)}/{totalLimitMB}MB
          </span>
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
          {boxFiles.length > 0 ? (
            <div className="mb-[40px] grid grid-cols-[repeat(auto-fill,240px)] gap-5">
              {boxFiles.map((file) => (
                <NoteCard
                  key={file.id}
                  label={file.label}
                  type={file.type}
                  thumbnailUrl={file.fileUrl}
                  mimeType={file.mimeType}
                  ocrStatus={file.ocrStatus}
                  isSelected={selectedIds.includes(file.id)}
                  isSelectMode={isSelectMode}
                  onSelect={() => toggleIdSelection(file.id)}
                  onClick={() => handleFileClick(file.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mb-[40px] flex h-[100px] items-center justify-center text-gray-400">
              업로드된 파일이 없습니다.
            </div>
          )}

          {/* THREAD 섹션 */}
          <div className="mb-3">
            <span className="text-[18px] font-semibold text-black">THREAD</span>
          </div>
          {threadFiles.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,240px)] gap-5">
              {threadFiles.map((file) => (
                <NoteCard
                  key={file.id}
                  label={file.label}
                  type={file.type}
                  thumbnailUrl={file.fileUrl}
                  mimeType={file.mimeType}
                  ocrStatus={file.ocrStatus}
                  isSelected={selectedIds.includes(file.id)}
                  isSelectMode={isSelectMode}
                  onSelect={() => toggleIdSelection(file.id)}
                  onClick={() => handleFileClick(file.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[100px] items-center justify-center text-gray-400">
              생성된 파일이 없습니다.
            </div>
          )}

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
