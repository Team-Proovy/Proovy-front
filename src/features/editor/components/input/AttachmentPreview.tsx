import { CloseIcon } from "@/shared/components/icons/SettingsIcons";
import type { Attachment } from "../../hooks/useAttachments";
import {
  formatFileSize,
  getFileTypeLabel,
  getFileIconColor,
} from "../../hooks/useAttachments";

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

/** 파일 타입 아이콘 (PDF, DOCX 등) */
const FileTypeIcon = ({ mimeType }: { mimeType: string }) => {
  const label = getFileTypeLabel(mimeType);
  const bgColor = getFileIconColor(mimeType);

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}
    >
      <span className="text-[10px] font-bold text-white">{label}</span>
    </div>
  );
};

/** 삭제(X) 버튼 */
const RemoveButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white shadow-md transition-colors hover:bg-gray-800"
  >
    <CloseIcon
      color="#D1D6DE"
      size={12}
    />
  </button>
);

/** 개별 첨부파일 카드 */
const AttachmentCard = ({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) => {
  const isImage =
    attachment.mimeType.startsWith("image/") ||
    attachment.mimeType === "canvas/drawing";
  const hasPreview = isImage && attachment.previewUrl;

  return (
    <div className="group relative shrink-0">
      <RemoveButton onClick={onRemove} />

      {hasPreview ? (
        /* 이미지 미리보기 카드 */
        <div className="h-[72px] w-[72px] overflow-hidden rounded-lg border border-[#E5E7EB]">
          <img
            src={attachment.previewUrl}
            alt={attachment.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        /* 파일 카드 (PDF, DOCX 등) */
        <div className="flex h-[72px] w-[180px] items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3">
          <FileTypeIcon mimeType={attachment.mimeType} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-gray-800">
              {attachment.name}
            </p>
            <p className="text-[11px] text-gray-400">
              {formatFileSize(attachment.size)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 첨부파일 미리보기 영역
 * - 입력 영역 위에 표시
 * - 가로 스크롤 가능
 * - 각 항목에 X 버튼으로 삭제
 */
export const AttachmentPreview = ({
  attachments,
  onRemove,
}: AttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="-mt-[12px] flex w-full shrink-0 gap-2 overflow-x-auto pt-2 pr-2 pb-1 pl-1 [scrollbar-width:thin]">
      {attachments.map((attachment) => (
        <AttachmentCard
          key={attachment.id}
          attachment={attachment}
          onRemove={() => onRemove(attachment.id)}
        />
      ))}
    </div>
  );
};
