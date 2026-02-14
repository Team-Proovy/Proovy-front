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
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import { assetKeys } from "@/features/storage/hooks/useAssets";
import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";
import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
import {
  isValidFileType,
  FILE_ACCEPT,
} from "@/features/assets/utils/fileValidation";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import { parseSize } from "@/shared/utils/file-utils";
import {
  PLAN_DETAILS,
  normalizePlanType,
} from "@/features/subscription/types/plan_types";
import { useAuthStore } from "@/features/auth/store/auth_store";

interface StorageFile {
  id: number;
  label: string;
  type: "upload" | "ai";
  fileUrl?: string;
  mimeType?: string;
  ocrStatus?: "pending" | "processing" | "completed" | "failed";
}

const normalizeOcrStatus = (
  status: string | undefined | null,
): StorageFile["ocrStatus"] => {
  const normalized = status?.toLowerCase();
  if (
    normalized === "pending" ||
    normalized === "processing" ||
    normalized === "completed" ||
    normalized === "failed"
  ) {
    return normalized;
  }
  return "pending";
};

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
  const { data: noteDetail, refetch } = useNoteDetail(noteId, undefined, {
    refetchInterval: hasProcessingAssets ? 2000 : false, // 2초로 단축
  });
  const { user } = useAuthStore();
  const { uploadAsset } = useAssetUpload();
  const [isUploading, setIsUploading] = useState(false);

  // OCR 처리 중인 에셋이 있으면 폴링 활성화
  useEffect(() => {
    const isProcessing =
      noteDetail?.assets?.some(
        (asset) =>
          (!!asset && normalizeOcrStatus(asset.ocrStatus) === "pending") ||
          normalizeOcrStatus(asset.ocrStatus) === "processing",
      ) ?? false;
    setHasProcessingAssets(isProcessing);

    // 처리 중이던 에셋이 완료되면 한 번 더 갱신
    if (!isProcessing && hasProcessingAssets) {
      refetch();
    }
  }, [noteDetail, hasProcessingAssets, refetch]);

  // BOX 파일 목록 (업로드된 자산)
  const boxFiles = useMemo<StorageFile[]>(() => {
    if (!noteDetail?.assets) return [];
    return noteDetail.assets.flatMap((asset) => {
      if (!asset || typeof asset.assetId !== "number") {
        return [];
      }

      return [
        {
          id: asset.assetId,
          label: asset.fileName,
          type: "upload" as const,
          fileUrl: asset.thumbnailUrl ?? undefined,
          mimeType: getMimeType(asset.fileType), // fileType -> mimeType 변환 적용
          ocrStatus: normalizeOcrStatus(asset.ocrStatus),
        },
      ];
    });
  }, [noteDetail]);

  // THREAD 파일 목록 (AI 생성 파일)
  const threadFiles = useMemo<StorageFile[]>(() => {
    if (!noteDetail?.conversations) return [];
    return noteDetail.conversations.flatMap((conv) => {
      const generatedFiles = Array.isArray(
        conv?.assistantMessage?.generatedFiles,
      )
        ? conv.assistantMessage.generatedFiles
        : [];

      return generatedFiles.flatMap((file) => {
        if (!file || typeof file.fileId !== "number") {
          return [];
        }

        return [
          {
            id: file.fileId,
            label: file.fileName,
            type: "ai" as const,
            fileUrl: file.downloadUrl,
            mimeType: getMimeType(file.fileType), // fileType -> mimeType 변환 적용
            ocrStatus: "completed" as const, // 생성된 파일은 OCR 완료 상태로 간주
          },
        ];
      });
    });
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
        // 쿼리 즉시 갱신 (refetch 사용)
        await Promise.all([
          queryClient.refetchQueries({ queryKey: noteKeys.detail(noteId) }),
          queryClient.refetchQueries({ queryKey: assetKeys.storage }),
        ]);

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

  // 파일 업로드 핸들러
  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!isValidFileType(file)) {
      alert("PDF 또는 이미지 파일만 업로드 가능합니다.");
      return;
    }

    const userPlan = normalizePlanType(user?.plan);
    const maxUploadSizeStr = PLAN_DETAILS[userPlan].maxUploadSize;
    const maxSizeBytes = parseSize(maxUploadSizeStr);

    if (file.size > maxSizeBytes) {
      alert(
        `파일 크기가 너무 큽니다. ${userPlan} 플랜의 최대 업로드 크기는 ${maxUploadSizeStr}입니다.`,
      );
      return;
    }

    try {
      setIsUploading(true);

      if (!noteId) {
        console.error("noteId가 없습니다.");
        alert("노트 정보를 찾을 수 없습니다. 페이지를 새로고침 해주세요.");
        setIsUploading(false);
        return;
      }

      const parsed = Number(noteId);
      if (isNaN(parsed) || parsed <= 0) {
        console.error(`유효하지 않은 noteId: ${noteId}`);
        alert("유효하지 않은 노트입니다. 노트를 다시 열어주세요.");
        setIsUploading(false);
        return;
      }

      const result = await uploadAsset(parsed, file);

      if (result?.assetId) {
        // 업로드 성공 시 쿼리 갱신
        await queryClient.refetchQueries({ queryKey: noteKeys.detail(noteId) });
        // 선택적으로 뷰어로 바로 이동할 수도 있지만, 요구사항은 "서버로 파일 업로드" 임.
        // 여기서는 업로드 후 목록에 표시되는 것이 우선.
      }
    } catch (err) {
      console.error("파일 업로드 실패:", err);
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    handleFileSelect,
    FILE_ACCEPT,
  );

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

  // 노트별 용량 제한은 512MB 고정
  const totalLimitMB = 512;

  const usedBytes =
    noteDetail?.assets?.reduce(
      (acc, asset) => acc + (asset?.fileSize ?? 0),
      0,
    ) ?? 0;

  const usedMB = usedBytes / 1024 / 1024;

  const usageRatio = usedMB / totalLimitMB;
  const isOverLimit = usageRatio > 0.9;

  return (
    <div className="flex h-full flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept={FILE_ACCEPT}
      />

      {/* 헤더: BOX | 선택 버튼 | 노트 용량 (한 줄) */}
      <div className="flex shrink-0 items-center border-b border-[#D1D6DE] px-6 py-3">
        {/* 선택 버튼 */}
        <button
          onClick={handleSelectToggle}
          className={`flex cursor-pointer items-center justify-center rounded-[12px] border-[0.5px] text-[14px] font-medium transition-all hover:border-transparent hover:bg-[#2A6AFF]/50 hover:text-white ${
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
          <div className="mb-[40px] grid grid-cols-[repeat(auto-fill,240px)] gap-5">
            {/* 업로드 버튼 (선택 모드가 아닐 때만 표시) */}
            {!isSelectMode && (
              <button
                onClick={openFileExplorer}
                disabled={isUploading}
                type="button"
                className="group flex cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white px-[20px] py-[36px] shadow-[4px_4px_20px_0px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  width: "240px",
                  height: "180px",
                }}
              >
                {isUploading ? (
                  <LoadingSpinner size={40} />
                ) : (
                  <>
                    <div>
                      <PdfIcon size={48} />
                    </div>
                    <p className="text-[16px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
                      파일 업로드 하기
                    </p>
                  </>
                )}
              </button>
            )}

            {/* 파일 리스트 */}
            {boxFiles.length > 0 ? (
              boxFiles.map((file) => (
                <NoteCard
                  key={file.id}
                  id={file.id}
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
              ))
            ) : (
              /* 파일이 없을 때 메시지 (업로드 버튼이 있으므로 굳이 필요 없거나, 버튼 옆에 텍스트로? 아니면 그냥 버튼만 있어도 됨) */
              /* 기존 로직: 파일 없으면 "업로드된 파일이 없습니다" 띄움. 
                 하지만 이제 버튼이 항상(선택모드 제외) 있으므로,
                 파일이 0개여도 업로드 버튼은 보임.
                 따라서 별도 Empty 메시지는 선택모드일 때만 필요할 수도 있음.
                 일단 여기서는 boxFiles가 map 되므로 자연스럽게 버튼 뒤에 아무것도 안 나옴.
               */
              <></>
            )}
          </div>

          {/* THREAD 섹션 */}
          <div className="mb-3">
            <span className="text-[18px] font-semibold text-black">THREAD</span>
          </div>
          {threadFiles.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,240px)] gap-5">
              {threadFiles.map((file) => (
                <NoteCard
                  key={file.id}
                  id={file.id}
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
              selectedCount={selectedIds.length}
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
