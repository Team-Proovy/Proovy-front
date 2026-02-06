export const validateFile = (file: File) => {
  const MAX_SIZE = 30 * 1024 * 1024;
  const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

  // 1. 파일 형식 체크
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "지원하지 않는 파일 형식입니다. PDF, PNG, JPEG 파일만 업로드 가능합니다.",
    );
  }

  // 2. 파일 크기 체크
  if (file.size > MAX_SIZE) {
    throw new Error("파일 크기가 30MB를 초과합니다.");
  }

  // 3. 파일명 길이 체크
  if (file.name.length < 2) {
    throw new Error("파일명은 최소 2자 이상이어야 합니다.");
  }

  return true;
};
