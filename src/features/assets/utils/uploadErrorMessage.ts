const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  ASSET4001: "파일 형식이 올바르지 않거나 손상된 파일입니다.",
  ASSET4002: "파일 크기 또는 해상도가 허용 한도를 초과했습니다.",
  STORAGE4002: "파일 크기 또는 해상도가 허용 한도를 초과했습니다.",
  STORAGE4005: "노트 저장 용량(512MB)을 초과했습니다.",
};

/** Server 업로드/확정 실패 코드(`ASSET*`/`STORAGE*`)를 사용자 안내 문구로 변환한다. */
export const resolveUploadErrorMessage = (
  error: unknown,
  fallback = "파일 업로드에 실패했습니다. 다시 시도해 주세요.",
): string => {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { code?: string } } })
      .response?.data;
    if (data?.code && UPLOAD_ERROR_MESSAGES[data.code]) {
      return UPLOAD_ERROR_MESSAGES[data.code];
    }
    return fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

/** Axios config/headers/signed URL을 제외하고 안전한 상태·코드·요약만 추출한다. */
export const summarizeUploadError = (
  error: unknown,
): { status?: number; code?: string; message: string } => {
  if (error && typeof error === "object") {
    const resp = (error as {
      response?: { status?: unknown; data?: { code?: unknown } };
      message?: unknown;
    }).response;
    const status = typeof resp?.status === "number" ? resp.status : undefined;
    const code =
      typeof resp?.data?.code === "string" ? resp.data.code : undefined;
    return {
      ...(status !== undefined && { status }),
      ...(code !== undefined && { code }),
      message: resolveUploadErrorMessage(error),
    };
  }
  return { message: "파일 업로드 중 오류가 발생했습니다." };
};
