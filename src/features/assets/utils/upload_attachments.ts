import type { Attachment } from "@/features/editor/hooks/useAttachments";
import { getUploadUrl, uploadToS3, confirmUpload } from "../api/assetApi";

/** 첨부 파일 업로드 결과 */
export interface UploadAttachmentsResult {
  /** 일반 파일 → mentionedAssetIds에 병합 */
  fileAssetIds: number[];
  /** 캔버스 그림 → canvasImageIds로 전달 */
  canvasAssetIds: number[];
}

/**
 * 첨부 파일 배열을 순차적으로 업로드하고 assetId를 반환한다.
 *
 * 흐름: presigned URL 발급 → S3 PUT → 서버 확정
 *
 * @param noteId  파일이 속할 노트 ID
 * @param attachments  업로드할 첨부 배열
 * @param onProgress  (완료 수, 전체 수) 콜백 (선택)
 */
export const uploadAttachments = async (
  noteId: number,
  attachments: Attachment[],
  onProgress?: (completed: number, total: number) => void,
): Promise<UploadAttachmentsResult> => {
  const fileAssetIds: number[] = [];
  const canvasAssetIds: number[] = [];

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];

    // Attachment → File 변환
    let file: File;
    if (attachment.type === "canvas" && attachment.blob) {
      file = new File([attachment.blob], `canvas_${Date.now()}.png`, {
        type: "image/png",
      });
    } else if (attachment.file) {
      file = attachment.file;
    } else {
      console.warn(
        `[uploadAttachments] 업로드 불가 첨부 건너뜀: ${attachment.name}`,
      );
      continue;
    }

    // 1. Presigned URL 발급
    const { result } = await getUploadUrl({
      noteId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    // 2. S3 업로드
    await uploadToS3(result.uploadUrl, file);

    // 3. 서버 확정 (OCR 시작)
    await confirmUpload(result.assetId);

    // 결과 분류
    if (attachment.type === "canvas") {
      canvasAssetIds.push(result.assetId);
    } else {
      fileAssetIds.push(result.assetId);
    }

    onProgress?.(i + 1, attachments.length);
  }

  return { fileAssetIds, canvasAssetIds };
};
