/**
 * 파일 관련 유틸리티 함수
 */

/**
 * 용량 문자열(예: "10MB", "1GB")을 바이트 단위 숫자로 변환합니다.
 * @param sizeStr 용량 문자열 (예: "10MB")
 * @returns 바이트 단위 크기 (number)
 */
export const parseSize = (sizeStr: string): number => {
  // 숫자와 단위 분리 (소수점 포함)
  const match = sizeStr.match(/^([\d.]+)\s*([A-Za-z]+)$/);

  if (!match) {
    // 숫자만 있는 경우 처리 (바이트 단위로 간주하거나 에러 처리. 여기서는 에러 처리)
    const justNumber = parseFloat(sizeStr);
    if (!isNaN(justNumber) && /^\d+$/.test(sizeStr)) {
      return justNumber;
    }
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (isNaN(value)) {
    throw new Error(`Invalid number format: ${match[1]}`);
  }

  // 단위별 변환
  if (unit === "TB") return value * 1024 * 1024 * 1024 * 1024;
  if (unit === "GB") return value * 1024 * 1024 * 1024;
  if (unit === "MB") return value * 1024 * 1024;
  if (unit === "KB") return value * 1024;
  if (unit === "B") return value;

  throw new Error(`Unsupported unit: ${unit}`);
};
