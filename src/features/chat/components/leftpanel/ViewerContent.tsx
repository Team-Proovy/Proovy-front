import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import type { RenderTask, PDFDocumentProxy } from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";
import { getDownloadUrl } from "@/features/assets/api/assetApi";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import { FILE_ACCEPT } from "@/features/assets/utils/fileValidation";

import { useAuthStore } from "@/features/auth/store/auth_store";
import { useStorageStore } from "@/features/storage/store/useStorageStore";
import {
  PLAN_DETAILS,
  type PlanType,
} from "@/features/subscription/types/plan_types";

// Worker 설정 (로컬 번들 사용)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const parseSize = (sizeStr: string) => {
  const value = parseInt(sizeStr.replace(/\D/g, ""), 10);
  const unit = sizeStr.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (unit.includes("GB")) return value * 1024 * 1024 * 1024;
  if (unit.includes("MB")) return value * 1024 * 1024;
  if (unit.includes("KB")) return value * 1024;
  return value;
};

interface ViewerContentProps {
  noteId: string;
  fileId?: string;
}

export const ViewerContent = ({ noteId, fileId }: ViewerContentProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { viewerFileId, setViewerFileId } = useStorageStore();

  // URL의 fileId가 있으면 스토어 업데이트 (딥링크 지원)
  useEffect(() => {
    if (fileId) {
      const parsedId = parseInt(fileId, 10);
      if (!isNaN(parsedId) && parsedId !== viewerFileId) {
        setViewerFileId(parsedId);
      }
    }
  }, [fileId, setViewerFileId, viewerFileId]);

  // 실제 사용할 ID 결정 (스토어 우선, 없으면 props)
  // props는 초기 로드 시 딥링크 처리를 위해 필요하지만, 이후엔 스토어 값이 우선됨
  const activeFileId = viewerFileId || (fileId ? parseInt(fileId, 10) : null);

  // ESC 키 핸들러: 파일 닫기 (스토어 + URL 초기화)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewerFileId(null); // 스토어 초기화
        setSearchParams(
          (prev) => {
            prev.delete("panel");
            prev.delete("file");
            return prev;
          },
          { replace: true },
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearchParams, setViewerFileId]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  const { uploadAsset } = useAssetUpload();

  // 파일 업로드 훅 사용
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

        // 업로드 성공 시 해당 파일로 즉시 이동
        if (result?.assetId) {
          setViewerFileId(result.assetId); // 스토어 업데이트
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

  // 1. 파일 URL 가져오기
  useEffect(() => {
    let cancelled = false;

    const fetchUrlData = async () => {
      if (!activeFileId) return;

      setIsLoading(true);
      setError(null);
      setPdfUrl(null);
      setFileType(null);
      setFileName("");
      setPageNumber(1);
      setNumPages(null);

      try {
        const response = await getDownloadUrl(activeFileId);
        if (cancelled) return;
        const { downloadUrl, fileName: fetchedFileName } = response.result;

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

  // 2. PDF 문서 로드 (pdfUrl 변경 시에만)
  useEffect(() => {
    if (!pdfUrl || fileType !== "pdf") {
      pdfRef.current = null;
      return;
    }

    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument(pdfUrl);

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("PDF 로드 오류:", err);
          setError("PDF를 불러오는 중 오류가 발생했습니다.");
        }
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      pdfRef.current = null;
    };
  }, [pdfUrl, fileType]);

  // 3. PDF 페이지 렌더링 (페이지/스케일 변경 시)
  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || fileType !== "pdf") return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvas: canvas,
          canvasContext: canvas.getContext("2d")!,
          viewport: viewport,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: unknown) {
        const renderErr = err as { name?: string };
        if (renderErr.name !== "RenderingCancelledException" && !cancelled) {
          console.error("PDF 렌더링 오류:", err);
          setError("PDF를 불러오는 중 오류가 발생했습니다.");
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pageNumber, scale, fileType, numPages]);

  if (!activeFileId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        {/* hidden input for file upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={FILE_ACCEPT}
        />

        {/* 파일 업로드 버튼 */}
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
  }

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* 파일 정보 및 네비게이션 바 */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#D1D6DE] bg-white px-4 py-2 shadow-sm">
        <span className="truncate text-sm font-medium text-gray-700">
          {fileName || `파일 ${activeFileId}`}
        </span>
        {fileType === "pdf" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
            >
              {"<"}
            </button>
            <span>
              {pageNumber} / {numPages || "-"}
            </span>
            <button
              onClick={() =>
                setPageNumber((prev) => Math.min(prev + 1, numPages || prev))
              }
              disabled={!numPages || pageNumber >= numPages}
              className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {/* 뷰어 영역 (PDF or Image) */}
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-gray-50 p-4 pt-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size={40} />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-red-500">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              다시 시도
            </button>
          </div>
        ) : fileType === "image" && pdfUrl ? (
          <img
            src={pdfUrl}
            alt={fileName}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="shadow-lg">
            <canvas
              ref={canvasRef}
              className="block bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};
