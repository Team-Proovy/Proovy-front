import { useState, useCallback, useRef } from "react";

/** 첨부 파일 타입 */
export type AttachmentType = "file" | "canvas";

/** 첨부 항목 */
export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  size: number; // bytes
  mimeType: string;
  /** 이미지 미리보기용 objectURL 또는 canvas blob URL */
  previewUrl?: string;
  /** 원본 File 객체 (업로드용) */
  file?: File;
  /** canvas blob (업로드용) */
  blob?: Blob;
}

/** 파일 크기 포맷 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/** MIME → 표시 타입 */
export const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word") || mimeType.includes("docx")) return "DOCX";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType === "canvas/drawing") return "IMG";
  return "FILE";
};

/** MIME → 아이콘 배경색 */
export const getFileIconColor = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "bg-red-500";
  if (mimeType.includes("word") || mimeType.includes("docx"))
    return "bg-blue-500";
  if (mimeType.startsWith("image/") || mimeType === "canvas/drawing")
    return "bg-green-500";
  return "bg-gray-500";
};

interface UseAttachmentsReturn {
  attachments: Attachment[];
  addFiles: (files: FileList | File[]) => void;
  addCanvasImage: (blob: Blob) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openFilePicker: () => void;
}

let attachmentIdCounter = 0;
const generateId = () => `att_${Date.now()}_${++attachmentIdCounter}`;

/**
 * 첨부 파일 관리 훅
 * - 파일 추가/삭제
 * - 캔버스 이미지 추가
 * - 파일 탐색기 열기
 */
export const useAttachments = (): UseAttachmentsReturn => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 파일 탐색기 열기 */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** 파일 추가 (클립 버튼 또는 드래그앤드롭) */
  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: generateId(),
        type: "file" as AttachmentType,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
        file,
      };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  /** 캔버스 이미지 추가 */
  const addCanvasImage = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const attachment: Attachment = {
      id: generateId(),
      type: "canvas",
      name: `캔버스 드로잉`,
      size: blob.size,
      mimeType: "canvas/drawing",
      previewUrl: url,
      blob,
    };
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  /** 첨부 삭제 */
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  /** 전체 삭제 */
  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
      return [];
    });
  }, []);

  return {
    attachments,
    addFiles,
    addCanvasImage,
    removeAttachment,
    clearAttachments,
    fileInputRef,
    openFilePicker,
  };
};
