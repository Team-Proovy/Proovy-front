import { useEffect, useState } from "react";
import { getDownloadUrl } from "@/features/assets/api/assetApi";
import { LoadingSpinner } from "@/shared/components/loading-spinner";
import { useViewerSync } from "@/features/chat/hooks/useViewerSync";
import { ViewerEmpty } from "./ViewerEmpty";
import { FileRenderer } from "./FileRenderer";

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

  // 2. 파일 데이터 가져오기 (Controller Logic)
  useEffect(() => {
    let cancelled = false;

    const fetchUrlData = async () => {
      if (!activeFileId) return;

      setIsLoading(true);
      setError(null);
      setPdfUrl(null);
      setFileType(null);
      setFileName("");

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

  // Case 1: 파일이 선택되지 않음 -> 업로드 UI (Empty State)
  if (!activeFileId) {
    return <ViewerEmpty noteId={noteId} />;
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
          className="mt-2 text-sm underline"
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
