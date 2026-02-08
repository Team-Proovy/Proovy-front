/** 채팅 메시지에 표시할 첨부파일 정보 */
export interface MessageAttachment {
  /** 표시할 파일명 */
  name: string;
  /** MIME 타입 (image/png, application/pdf 등) */
  mimeType: string;
  /** 파일 크기 (bytes) */
  size: number;
  /** 미리보기 URL (이미지용 objectURL) */
  previewUrl?: string;
}

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** 사용자가 첨부한 파일 목록 (user 메시지에만 존재) */
  attachments?: MessageAttachment[];
}
