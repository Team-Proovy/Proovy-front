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

/** AI 도구 실행 상태바 */
export interface ToolStatus {
  id: string;
  icon: "python" | "transform";
  label: string;
}

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** 사용자가 첨부한 파일 목록 (user 메시지에만 존재) */
  attachments?: MessageAttachment[];
  /** SSE 스트리밍 진행 중 여부 (assistant 메시지에만 사용) */
  isStreaming?: boolean;
  /** AI 진행 상황 텍스트 — message(custom) 이벤트의 status (assistant 메시지에만 사용) */
  statusText?: string;
  /** AI 도구 실행 상태바 목록 (assistant 메시지에만 사용) */
  toolStatuses?: ToolStatus[];
}
