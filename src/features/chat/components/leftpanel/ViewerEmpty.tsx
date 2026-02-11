import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import { FILE_ACCEPT } from "@/features/assets/utils/fileValidation";
import { useAuthStore } from "@/features/auth/store/auth_store";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import {
  PLAN_DETAILS,
  type PlanType,
} from "@/features/subscription/types/plan_types";

interface ViewerEmptyProps {
  noteId: string;
}

const parseSize = (sizeStr: string) => {
  const value = parseInt(sizeStr.replace(/\D/g, ""), 10);
  const unit = sizeStr.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (unit.includes("GB")) return value * 1024 * 1024 * 1024;
  if (unit.includes("MB")) return value * 1024 * 1024;
  if (unit.includes("KB")) return value * 1024;
  return value;
};

export const ViewerEmpty = ({ noteId }: ViewerEmptyProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { setViewerFileId } = useStorageStore();
  const { uploadAsset } = useAssetUpload();

  const { fileInputRef, openFileExplorer, handleFileChange } = useFileUpload(
    async (file) => {
      if (!file) return;

      const isValidType =
        file.type === "application/pdf" || file.type.startsWith("image/");

      if (!isValidType) {
        alert("PDF 또는 이미지 파일만 업로드 가능합니다.");
        return;
      }

      const userPlan = (user?.plan as PlanType) || "Free";
      const maxUploadSizeStr = PLAN_DETAILS[userPlan]?.maxUploadSize || "10MB";
      const maxSizeBytes = parseSize(maxUploadSizeStr);

      if (file.size > maxSizeBytes) {
        alert(
          `파일 크기가 너무 큽니다. ${userPlan} 플랜의 최대 업로드 크기는 ${maxUploadSizeStr}입니다.`,
        );
        return;
      }

      try {
        setIsLoading(true);
        const parsed = parseInt(noteId, 10);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          setError("유효하지 않은 노트입니다. 노트를 다시 열어주세요.");
          setIsLoading(false);
          return;
        }

        const result = await uploadAsset(parsed, file);

        if (result?.assetId) {
          setViewerFileId(result.assetId);
          setSearchParams((prev) => {
            prev.set("panel", "viewer");
            prev.set("file", result.assetId.toString());
            return prev;
          });
        }
      } catch (err) {
        console.error("파일 업로드 실패:", err);
        setError("파일 업로드에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-sm underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept={FILE_ACCEPT}
      />

      <button
        onClick={openFileExplorer}
        type="button"
        className="group flex h-[160px] w-[220px] cursor-pointer flex-col items-center justify-center gap-[16px] rounded-[12px] border-[0.5px] border-[#C6C6C6] bg-white/40 px-[20px] py-[36px] shadow-[4px_4px_20px_5px_rgba(0,0,0,0.05)] transition-colors duration-700 hover:bg-[#2A6AFF33] active:bg-[#2A6AFF33]"
      >
        <div>
          <PdfIcon size={56} />
        </div>
        <p className="text-[18px] font-normal text-[#666666] transition-colors duration-700 group-hover:text-[#2542F0]">
          뷰어로 파일 업로드
        </p>
      </button>
    </div>
  );
};
