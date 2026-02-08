import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { useFileUpload } from "@/shared/hooks/useFileUpload";
import { PdfIcon } from "@/shared/components/icons/HomepageInputIcons";
import { getDownloadUrl } from "@/features/assets/api/assetApi";
import { useAssetUpload } from "@/features/assets/hooks/useAssetUpload";

// Worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<ReturnType<
    ReturnType<typeof pdfjsLib.getDocument>["promise"]["then"]
  > | null>(null);

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

      try {
        setIsLoading(true);
        const targetNoteId = parseInt(noteId, 10) || 1;

        const result = await uploadAsset(targetNoteId, file);

        // 업로드 성공 시 해당 파일로 즉시 이동
        if (result?.assetId) {
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
    const fetchUrlData = async () => {
      if (!fileId) return;

      setIsLoading(true);
      setError(null);
      setPdfUrl(null);
      setFileType(null);
      setFileName("");
      setPageNumber(1);

      try {
        const numericId = parseInt(fileId, 10);
        if (isNaN(numericId)) {
          throw new Error("유효하지 않은 파일 ID입니다.");
        }

        const response = await getDownloadUrl(numericId);
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
          setFileType("image");
        }
      } catch (err) {
        console.error("파일 URL 가져오기 실패:", err);
        // 테스트용 Fallback
        setPdfUrl(
          "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        );
        setFileType("pdf");
        setFileName("sample.pdf");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrlData();
  }, [fileId]);

  // 2. PDF 렌더링
  useEffect(() => {
    if (!pdfUrl || fileType !== "pdf") return;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          (renderTaskRef.current as any).cancel?.();
        }

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(pageNumber);
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
        renderTaskRef.current = renderTask as any;

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF 렌더링 오류:", err);
          setError("PDF를 불러오는 중 오류가 발생했습니다.");
        }
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        (renderTaskRef.current as any).cancel?.();
      }
    };
  }, [pdfUrl, pageNumber, scale, fileType]);

  if (!fileId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        {/* hidden input for file upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf"
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
          {fileName || `${fileId}.pdf`}
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
