import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Worker 설정: PDF 렌더링을 별도 스레드에서 처리한다.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  fileUrl: string; // preview할 PDF의 Blob URL
  width?: number; // 캔버스 넓이 (선택)
}

export const PdfPreview = ({ fileUrl, width = 180 }: PdfPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    const renderPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        if (isCancelled) return;

        const page = await pdf.getPage(1); // 첫 번째 페이지 가져오기

        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // 원본 비율 유지하며 너비(width)에 맞춰 스케일 계산
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = width / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 최신 버전(v4+) 규격에 맞춰 canvas 엘리먼트 자체를 전달
        renderTask = page.render({
          canvas: canvas,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (error: any) {
        if (error.name === "RenderingCancelledException" || isCancelled) {
          // 렌더링 취소는 에러가 아님
          console.log("PDF 렌더링 취소됨");
        } else {
          console.error("PDF Preview 렌더링 실패:", error);
        }
      }
    };

    if (fileUrl) {
      renderPdf();
    }

    // Cleanup: 컴포넌트 언마운트나 re-render 시 진행 중인 렌더링 취소
    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [fileUrl, width]); // 파일이나 너비가 바뀌면 다시 렌더링한다.

  return (
    <div className="flex justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
      <canvas ref={canvasRef} />
    </div>
  );
};
