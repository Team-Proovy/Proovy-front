import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { RenderTask, PDFDocumentProxy } from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { LoadingSpinner } from "@/shared/components/loading-spinner";

// Worker 설정 (로컬 번들 사용)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

interface FileRendererProps {
  fileUrl: string | null;
  fileType: "pdf" | "image" | null;
  fileName: string;
}

export const FileRenderer = ({
  fileUrl,
  fileType,
  fileName,
}: FileRendererProps) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  // 1. PDF 문서 로드
  useEffect(() => {
    if (!fileUrl || fileType !== "pdf") {
      pdfRef.current = null;
      return;
    }

    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument(fileUrl);

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNumber(1); // 파일 변경 시 페이지 초기화
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
  }, [fileUrl, fileType]);

  // 2. PDF 페이지 렌더링
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
  }, [pageNumber, scale, fileType, numPages]); // fileType 의존성 추가 (이미지 -> PDF 전환 시 필요)

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (fileType === "image" && fileUrl) {
    return (
      <div className="flex h-full flex-col bg-gray-100">
        {/* 네비게이션 바 (이미지용 - 페이지 컨트롤 없음) */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#D1D6DE] bg-white px-4 py-2 shadow-sm">
          <span className="truncate text-sm font-medium text-gray-700">
            {fileName}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-gray-50 p-4 pt-6">
          <img
            src={fileUrl}
            alt={fileName}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  if (fileType === "pdf") {
    return (
      <div className="flex h-full flex-col bg-gray-100">
        {/* 네비게이션 바 */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#D1D6DE] bg-white px-4 py-2 shadow-sm">
          <span className="truncate text-sm font-medium text-gray-700">
            {fileName} (PDF)
          </span>
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
        </div>

        {/* 캔버스 영역 */}
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-gray-50 p-4 pt-6">
          <div className="shadow-lg">
            <canvas
              ref={canvasRef}
              className="block bg-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  );
};
