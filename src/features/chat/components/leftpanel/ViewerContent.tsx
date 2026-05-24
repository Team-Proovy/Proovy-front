import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDownloadUrl } from "@/features/assets/api/assetApi";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import { useViewerSync } from "@/features/chat/hooks/useViewerSync";
import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
import { useAuthStore } from "@/features/auth/store/auth_store";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import { FILE_ACCEPT } from "@/features/assets/utils/fileValidation";
import {
  PLAN_DETAILS,
  type PlanType,
} from "@/features/subscription/types/plan_types";

import { ViewerUploadCard } from "@/pages/components/ViewerUploadCard";
import { FileRenderer } from "./FileRenderer";
import { parseSize } from "@/shared/utils/file-utils";
import { showErrorToast } from "@/shared/lib/toast";

interface ViewerContentProps {
  noteId: string;
  fileId?: string;
}

export const ViewerContent = ({ noteId, fileId }: ViewerContentProps) => {
  // 1. 상태 동기화 및 전역 이벤트 핸들링 (커스텀 훅)
  const { activeFileId } = useViewerSync(fileId);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { setViewerFileId } = useStorageStore();
  const { uploadAsset } = useAssetUpload();

  // 파일 선택/드롭 핸들러
  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const isValidType =
      file.type === "application/pdf" || file.type.startsWith("image/");

    if (!isValidType) {
      showErrorToast("PDF 또는 이미지 파일만 업로드 가능합니다.");
      return;
    }

    const userPlan = (user?.plan as PlanType) || "Free";
    const maxUploadSizeStr = PLAN_DETAILS[userPlan]?.maxUploadSize || "10MB";
    const maxSizeBytes = parseSize(maxUploadSizeStr);

    if (file.size > maxSizeBytes) {
      showErrorToast(
        `파일 크기가 너무 큽니다. ${userPlan} 플랜의 최대 업로드 크기는 ${maxUploadSizeStr}입니다.`,
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const parsed = parseInt(noteId, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setError("유효하지 않은 노트입니다. 노트를 다시 열어주세요.");
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
        // 업로드 성공 후 로딩 상태 해제는 activeFileId 변경에 의한 useEffect나 완료 시점에서 처리
      }
    } catch (err) {
      console.error("파일 업로드 실패:", err);
      setError("파일 업로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const {
    fileInputRef,
    openFileExplorer,
    handleFileChange,
    isDragging,
    dragProps,
  } = useFileUpload(handleFileSelect, FILE_ACCEPT);

  // 2. 파일 데이터 가져오기 (Controller Logic)
  useEffect(() => {
    let cancelled = false;

    const fetchUrlData = async () => {
      if (!activeFileId) {
        setPdfUrl(null);
        setFileType(null);
        setFileName("");
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setPdfUrl(null);
      setFileType(null);
      setFileName("");

      try {
        const response = await getDownloadUrl(activeFileId);
        if (cancelled) return;
        const downloadResult = response?.result;

        if (!downloadResult?.downloadUrl || !downloadResult?.fileName) {
          setError("파일 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.");
          return;
        }

        const { downloadUrl, fileName: fetchedFileName } = downloadResult;

        setPdfUrl(downloadUrl);
        setFileName(fetchedFileName);

        // 파일 확장자로 타입 추론
        const lowerName = fetchedFileName.toLowerCase();
        if (lowerName.endsWith(".pdf")) {
          setFileType("pdf");
        } else if (
          lowerName.endsWith(".jpg") ||
          lowerName.endsWith(".jpeg") ||
          lowerName.endsWith(".png") ||
          lowerName.endsWith(".webp")
        ) {
          setFileType("image");
        } else {
          setFileType(null);
          setError("지원하지 않는 파일 형식입니다.");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("파일 URL 가져오기 실패:", err);
        setError("파일을 불러오는 데 실패했습니다. 다시 시도해주세요.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUrlData();
    return () => {
      cancelled = true;
    };
  }, [activeFileId]);

  // 3. 노트 변경 시 뷰어 상태 초기화 (Stale State 방지)
  useEffect(() => {
    // 새 노트에 파일이 없을때만 전체 초기화 수행
    // 파일이 있는 경우 Effect 2의 activeFileId 변경이 상태를 처리함
    if (!fileId) {
      setPdfUrl(null);
      setFileType(null);
      setFileName("");
      setIsLoading(false);
      setError(null);
      setViewerFileId(null);
    }
  }, [noteId, fileId, setViewerFileId]);

  const renderContent = () => {
    // Case 1: 파일이 선택되지 않음 -> 업로드 UI (Empty State)
    if (!activeFileId) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6">
          <ViewerUploadCard
            pdfUrl={null}
            fileName=""
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onOpenExplorer={openFileExplorer}
            onRemove={() => {}}
            isDragging={isDragging}
            dragProps={dragProps}
          />
          <p className="text-center font-[Pretendard] text-[16px] leading-6 font-normal whitespace-pre-line text-[#6B7280]">
            {"파일이 비어있습니다.\n파일을 끌어오거나 클릭해서 추가해 주세요."}
          </p>
        </div>
      );
    }

    // Case 2: 로딩 중
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size={40} />
        </div>
      );
    }

    // Case 3: 에러 발생
    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-red-500">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 cursor-pointer text-sm underline"
          >
            다시 시도
          </button>
        </div>
      );
    }

    // Case 4: 파일 렌더링 (PDF / Image)
    return (
      <FileRenderer
        fileUrl={pdfUrl}
        fileType={fileType}
        fileName={fileName}
      />
    );
  };

  return <div className="relative h-full w-full">{renderContent()}</div>;
};
