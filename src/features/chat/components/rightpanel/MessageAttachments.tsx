import type { MessageAttachment } from "../../types/chat_types";
import {
  formatFileSize,
  getFileTypeLabel,
  getFileIconColor,
} from "@/features/assets/utils/fileValidation";

/** 개별 이미지 첨부 카드 */
const ImageAttachmentCard = ({
  attachment,
}: {
  attachment: MessageAttachment;
}) => (
  <div className="h-[72px] w-[72px] overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE]">
    <img
      src={attachment.previewUrl}
      alt={attachment.name}
      className="h-full w-full object-cover"
    />
  </div>
);

/** 개별 파일(PDF 등) 첨부 카드 */
const FileAttachmentCard = ({
  attachment,
}: {
  attachment: MessageAttachment;
}) => {
  const label = getFileTypeLabel(attachment.mimeType);
  const bgColor = getFileIconColor(attachment.mimeType);

  return (
    <div className="flex h-[72px] items-center gap-3 rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white px-3 pr-4">
      {/* 파일 타입 뱃지 */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgColor}`}
      >
        <span className="text-[10px] font-bold text-white">{label}</span>
      </div>
      {/* 파일 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-gray-800">
          {attachment.name}
        </p>
        <p className="text-[11px] text-gray-400">
          {formatFileSize(attachment.size)}
        </p>
      </div>
    </div>
  );
};

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
}

/**
 * 사용자 메시지 위에 표시되는 첨부파일 미리보기
 * - 이미지: 썸네일 카드
 * - PDF 등: 파일 정보 카드
 */
export const MessageAttachments = ({
  attachments,
}: MessageAttachmentsProps) => {
  if (attachments.length === 0) return null;

  const imageAttachments = attachments.filter((a) =>
    a.mimeType.startsWith("image/"),
  );
  const fileAttachments = attachments.filter(
    (a) => !a.mimeType.startsWith("image/"),
  );

  return (
    <div className="mb-[8px] flex flex-wrap justify-end gap-2">
      {/* 이미지 첨부 */}
      {imageAttachments.map((attachment, i) => (
        <ImageAttachmentCard
          key={`img-${i}`}
          attachment={attachment}
        />
      ))}
      {/* 파일 첨부 (PDF 등) */}
      {fileAttachments.map((attachment, i) => (
        <FileAttachmentCard
          key={`file-${i}`}
          attachment={attachment}
        />
      ))}
    </div>
  );
};
