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
  const [containerWidth, setContainerWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  // 컨테이너 너비 감지 → 캔버스 base scale 계산에 사용
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fileType]); // fileType 전환 시 새 scroll container에 재부착

  // Ctrl+휠 줌 / 핀치 줌
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) =>
        Math.min(Math.max(z + (e.deltaY < 0 ? 0.1 : -0.1), 0.5), 3.0),
      );
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2)
        lastTouchDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastTouchDistRef.current === null) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setZoom((z) =>
        Math.min(Math.max(z * (dist / lastTouchDistRef.current!), 0.5), 3.0),
      );
      lastTouchDistRef.current = dist;
    };
    const onTouchEnd = () => {
      lastTouchDistRef.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [fileType]);

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
        setPageNumber(1);
        setZoom(1.0); // 파일 변경 시 zoom 초기화
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

        // 컨테이너 너비에 맞는 base scale 계산 (padding 32px 제외)
        const naturalViewport = page.getViewport({ scale: 1.0 });
        const fitScale =
          containerWidth > 0
            ? Math.max((containerWidth - 32) / naturalViewport.width, 0.1)
            : 1.0;
        const viewport = page.getViewport({ scale: fitScale });
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
  }, [pageNumber, fileType, numPages, containerWidth]);

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

  if (fileType === "image" && fileUrl) {
    return (
      <div className="flex h-full flex-col bg-gray-100">
        {/* 네비게이션 바 (이미지용 - 페이지 컨트롤 없음) */}
        <div className="flex shrink-0 items-center justify-center border-b border-[#D1D6DE] bg-white px-4 py-2 shadow-sm">
          <span className="truncate text-center font-[Pretendard] text-[18px] leading-7 font-semibold tracking-[-0.002px] text-black">
            {fileName}
          </span>
        </div>

        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-auto bg-gray-50"
        >
          <div className="flex min-h-full min-w-max items-center justify-center p-4 pt-6">
            <div
              style={{
                zoom,
                width: containerWidth > 0 ? containerWidth - 32 : undefined,
              }}
            >
              <img
                src={fileUrl}
                alt={fileName}
                className="block h-auto max-h-[80vh] w-full object-contain"
                onLoad={() => setZoom(1.0)}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fileType === "pdf") {
    return (
      <div className="flex h-full flex-col bg-gray-100">
        {/* 네비게이션 바 */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#D1D6DE] bg-white px-4 py-2 shadow-sm">
          <span className="min-w-0 flex-1 truncate text-center font-[Pretendard] text-[18px] leading-7 font-semibold tracking-[-0.002px] text-black">
            {fileName}
          </span>
          <div className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-black">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.2931 8.29279C11.4806 8.10532 11.7349 8 12.0001 8C12.2652 8 12.5195 8.10532 12.7071 8.29279L18.3641 13.9498C18.5462 14.1384 18.647 14.391 18.6447 14.6532C18.6425 14.9154 18.5373 15.1662 18.3519 15.3516C18.1665 15.537 17.9157 15.6422 17.6535 15.6445C17.3913 15.6467 17.1387 15.5459 16.9501 15.3638L12.0001 10.4138L7.05006 15.3638C6.86146 15.5459 6.60885 15.6467 6.34666 15.6445C6.08446 15.6422 5.83365 15.537 5.64824 15.3516C5.46283 15.1662 5.35766 14.9154 5.35538 14.6532C5.35311 14.391 5.4539 14.1384 5.63606 13.9498L11.2931 8.29279Z"
                  fill="black"
                />
              </svg>
            </button>
            <span className="shrink-0 px-1">
              {pageNumber} / {numPages || "-"}
            </span>
            <button
              onClick={() =>
                setPageNumber((prev) => Math.min(prev + 1, numPages || prev))
              }
              disabled={!numPages || pageNumber >= numPages}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="8"
                viewBox="0 0 14 8"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.37629 7.37629C7.18876 7.56376 6.93445 7.66907 6.66929 7.66907C6.40412 7.66907 6.14982 7.56376 5.96229 7.37629L0.305288 1.71929C0.209778 1.62704 0.133596 1.5167 0.0811869 1.39469C0.0287779 1.27269 0.00119157 1.14147 3.77564e-05 1.00869C-0.00111606 0.87591 0.0241859 0.744231 0.0744668 0.621335C0.124748 0.498438 0.199001 0.386786 0.292893 0.292893C0.386786 0.199 0.498438 0.124747 0.621334 0.0744663C0.744231 0.0241854 0.87591 -0.00111606 1.00869 3.77571e-05C1.14147 0.00119157 1.27269 0.0287779 1.39469 0.0811869C1.5167 0.133596 1.62704 0.209778 1.71929 0.305288L6.66929 5.25529L11.6193 0.305288C11.8079 0.12313 12.0605 0.0223355 12.3227 0.0246139C12.5849 0.0268924 12.8357 0.132061 13.0211 0.317469C13.2065 0.502877 13.3117 0.75369 13.314 1.01589C13.3162 1.27808 13.2154 1.53069 13.0333 1.71929L7.37629 7.37629Z"
                  fill="black"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 캔버스 영역 — 줌 시 overflow 스크롤 가능하도록 레이아웃 분리 */}
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-auto bg-gray-50"
        >
          <div className="flex min-h-full min-w-max justify-center p-4 pt-6">
            <div
              className="h-fit shadow-lg"
              style={{ zoom }}
            >
              <canvas
                ref={canvasRef}
                className="block bg-white"
                draggable={false}
              />
            </div>
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
