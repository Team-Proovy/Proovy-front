/** 업로드 허용 MIME 타입 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

/** 확장자 기반 폴백 (file.type이 비어있을 때) */
export const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

/** 최대 파일 크기: 30MB */
export const MAX_FILE_SIZE = 30 * 1024 * 1024;

/** <input accept>에 쓸 수 있는 문자열 */
export const FILE_ACCEPT = ALLOWED_EXTENSIONS.join(",");

/**
 * 파일이 허용된 형식/크기인지 boolean 반환 (UI 필터링용)
 * - 드래그앤드롭, 첨부 전 검증 등에 사용
 */
export const isFileAllowed = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) return false;
  if (file.type && ALLOWED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ext ? ALLOWED_EXTENSIONS.includes(`.${ext}`) : false;
};

/**
 * 파일 유효성 검증 (업로드 API 호출 전 사용)
 * - 실패 시 Error throw
 */
export const validateFile = (file: File) => {
  // 1. 파일 크기 체크
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("파일 크기가 30MB를 초과합니다.");
  }

  // 2. 파일 형식 체크 (MIME → 확장자 폴백)
  if (file.type) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        "지원하지 않는 파일 형식입니다. PDF, PNG, JPEG, WEBP 파일만 업로드 가능합니다.",
      );
    }
  } else {
    const ext = file.name.toLowerCase().split(".").pop();
    if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
      throw new Error(
        "지원하지 않는 파일 형식입니다. PDF, PNG, JPEG, WEBP 파일만 업로드 가능합니다.",
      );
    }
  }

  // 3. 파일명 길이 체크
  if (file.name.length < 2) {
    throw new Error("파일명은 최소 2자 이상이어야 합니다.");
  }

  return true;
};

// ============================================================
// 파일 표시 유틸 (포맷, 라벨, 색상)
// ============================================================

/** 바이트 → 사람이 읽기 쉬운 크기 문자열 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** MIME → 표시 라벨 (첨부 프리뷰용) */
export const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType === "canvas/drawing") return "IMG";
  return "FILE";
};

/** MIME → 아이콘 배경색 Tailwind 클래스 (첨부 프리뷰용) */
export const getFileIconColor = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "bg-red-500";
  if (mimeType.startsWith("image/") || mimeType === "canvas/drawing")
    return "bg-green-500";
  return "bg-gray-500";
};

/** 서버 fileType → 뱃지 배경색 Tailwind 클래스 (#멘션 메뉴용) */
export const getFileTypeColor = (fileType: string): string => {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "bg-red-400";
    case "docx":
      return "bg-blue-400";
    case "image":
      return "bg-green-400";
    case "code":
      return "bg-purple-400";
    default:
      return "bg-gray-400";
  }
};
