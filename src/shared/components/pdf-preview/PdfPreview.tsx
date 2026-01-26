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
    const renderPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // 첫 번째 페이지 가져오기

        const canvas = canvasRef.current;
        if (!canvas) return;

        // 원본 비율 유지하며 너비(width)에 맞춰 스케일 계산
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = width / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 최신 버전(v4+) 규격에 맞춰 canvas 엘리먼트 자체를 전달
        const renderTask = page.render({
          canvas: canvas,
          viewport: viewport,
        });
        
        await renderTask.promise;
      } catch (error) {
        console.error("PDF Preview 렌더링 실패:", error);
      }
    };

    if (fileUrl) {
      renderPdf();
    }
  }, [fileUrl, width]); // 파일이나 너비가 바뀌면 다시 렌더링한다.

  return (
    <div className="flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 shadow-sm border border-gray-200">
      <canvas ref={canvasRef} />
    </div>
  );
};