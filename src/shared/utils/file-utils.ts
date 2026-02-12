/**
 * 파일 관련 유틸리티 함수
 */

/**
 * 용량 문자열(예: "10MB", "1GB")을 바이트 단위 숫자로 변환합니다.
 * @param sizeStr 용량 문자열 (예: "10MB")
 * @returns 바이트 단위 크기 (number)
 */
export const parseSize = (sizeStr: string): number => {
  const value = parseInt(sizeStr.replace(/\D/g, ""), 10);
  const unit = sizeStr.replace(/[^A-Za-z]/g, "").toUpperCase();

  if (unit.includes("TB")) return value * 1024 * 1024 * 1024 * 1024;
  if (unit.includes("GB")) return value * 1024 * 1024 * 1024;
  if (unit.includes("MB")) return value * 1024 * 1024;
  if (unit.includes("KB")) return value * 1024;
  return value;
};
