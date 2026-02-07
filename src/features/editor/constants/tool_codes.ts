/**
 * UI 도구 이름 → API mentionedToolCodes 매핑
 * API 스펙: @로 멘션한 도구 코드 목록 (예: "SOLUTION")
 */
export const TOOL_NAME_TO_CODE: Record<string, string> = {
  "그래프 그리기": "GRAPH",
  "해설지 생성하기": "SOLUTION",
  "캔버스 열기": "CANVAS",
  "코드 검산 진행하기": "CODE_VERIFY",
};

/** 도구 이름으로 API 코드 반환 */
export const getToolCode = (toolName: string | null): string | null => {
  if (!toolName) return null;
  return TOOL_NAME_TO_CODE[toolName] ?? null;
};
