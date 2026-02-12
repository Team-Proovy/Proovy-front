import { useState, useCallback, useRef, useEffect } from "react";
import {
  isValidFileType,
  formatFileSize,
  getFileTypeLabel,
  getFileIconColor,
} from "@/features/assets/utils/fileValidation";
import { useAuthStore } from "@/features/auth/store/auth_store";
import {
  PLAN_DETAILS,
  normalizePlanType,
} from "@/features/subscription/types/plan_types";
import { parseSize } from "@/shared/utils/file-utils";

// 파일 표시 유틸 re-export (기존 import 경로 호환)
export { formatFileSize, getFileTypeLabel, getFileIconColor };

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

interface UseAttachmentsReturn {
  attachments: Attachment[];
  addFiles: (files: FileList | File[]) => void;
  addCanvasImage: (blob: Blob) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openFilePicker: () => void;
  /** 드래그앤드롭 */
  isDragOver: boolean;
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
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
  const attachmentsRef = useRef(attachments);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  const [isDragOver, setIsDragOver] = useState(false);
  /* user store access */
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  /** 파일 탐색기 열기 */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** 파일 추가 (클립 버튼 또는 드래그앤드롭) */
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const userPlan = normalizePlanType(user?.plan);
      const maxUploadSizeStr = PLAN_DETAILS[userPlan].maxUploadSize;
      const maxSizeBytes = parseSize(maxUploadSizeStr);

      const validFiles = Array.from(files).filter((file) => {
        // 1. 형식 체크
        if (!isValidFileType(file)) {
          alert("허용되지 않은 파일 형식입니다.");
          return false;
        }

        // 2. 용량 체크 (플랜 기반)
        if (file.size > maxSizeBytes) {
          alert(
            `파일 크기가 너무 큽니다. ${userPlan} 플랜의 최대 업로드 크기는 ${maxUploadSizeStr}입니다.`,
          );
          return false;
        }

        return true;
      });

      const newAttachments: Attachment[] = validFiles.map((file) => {
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
    },
    [user],
  );

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

  /** 드래그앤드롭 핸들러 */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      // addFiles 내부에서 유효성 검사 수행
      addFiles(files);
    },
    [addFiles, user],
  );

  const dragHandlers = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  // Unmount 시 남아있는 previewUrl 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, []);

  return {
    attachments,
    addFiles,
    addCanvasImage,
    removeAttachment,
    clearAttachments,
    fileInputRef,
    openFilePicker,
    isDragOver,
    dragHandlers,
  };
};
