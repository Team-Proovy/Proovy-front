import { RUN_ERROR_CODES } from "@/shared/contracts/browser_run_v1";
import type { RunErrorCode, Uuid } from "@/shared/contracts/browser_run_v1";
import { isUuid } from "./run_request";

/**
 * stream 시작 전·조회 API의 오류 응답 (browser-run-v1 `ErrorResponse`).
 * `Accept: text/event-stream`이어도 stream 전 오류는 JSON `ApiResponse`다.
 * `code`로 구분하고, 계약 밖 응답(COMMON500·proxy HTML 등)은 `code: null`이다.
 */
export type RunApiErrorDetail =
  | {
      code: "RUN4091";
      status: number;
      message: string;
      /** 이 Note에서 진행 중인 run. `GET /api/ai-runs/{activeRunId}/events`로 이어 볼 수 있다. */
      activeRunId: Uuid;
    }
  | {
      code: "RUN4291";
      status: number;
      message: string;
      /** `Retry-After` header(초). 없거나 해석할 수 없으면 null */
      retryAfterSeconds: number | null;
    }
  | {
      code: Exclude<RunErrorCode, "RUN4091" | "RUN4291">;
      status: number;
      message: string;
    }
  | {
      code: null;
      status: number;
      /** body에 문자열 code가 있었으면 그 값(예: `COMMON500`) */
      rawCode: string | null;
      message: string | null;
    };

export class RunApiError extends Error {
  readonly detail: RunApiErrorDetail;

  constructor(detail: RunApiErrorDetail) {
    super(detail.message ?? `HTTP ${detail.status} 계약 밖 응답`);
    this.name = "RunApiError";
    this.detail = detail;
  }

  get status() {
    return this.detail.status;
  }

  get code() {
    return this.detail.code;
  }
}

const isRunErrorCode = (value: unknown): value is RunErrorCode =>
  (RUN_ERROR_CODES as readonly unknown[]).includes(value);

/** 실패 응답(`!response.ok`)의 body·header를 읽어 `RunApiError`로 만든다. body는 소비된다. */
export const readRunApiError = async (
  response: Response,
  now: number = Date.now(),
): Promise<RunApiError> => {
  let body: unknown = null;
  try {
    body = JSON.parse(await response.text());
  } catch {
    // JSON이 아닌 오류 본문(proxy 502 HTML 등)은 계약 밖 응답으로 둔다.
  }
  return toRunApiError(
    response.status,
    body,
    response.headers.get("Retry-After"),
    now,
  );
};

/** status·JSON body·`Retry-After`로 오류를 해석한다. */
export const toRunApiError = (
  status: number,
  body: unknown,
  retryAfter: string | null = null,
  now: number = Date.now(),
): RunApiError => {
  const envelope =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const code = envelope.code;
  const message =
    typeof envelope.message === "string" ? envelope.message : null;

  if (envelope.isSuccess === false && isRunErrorCode(code) && message) {
    if (code === "RUN4091") {
      const result = envelope.result as { activeRunId?: unknown } | undefined;
      if (isUuid(result?.activeRunId))
        return new RunApiError({
          code,
          status,
          message,
          activeRunId: result.activeRunId,
        });
    } else if (code === "RUN4291") {
      return new RunApiError({
        code,
        status,
        message,
        retryAfterSeconds: parseRetryAfter(retryAfter, now),
      });
    } else {
      return new RunApiError({ code, status, message });
    }
  }

  return new RunApiError({
    code: null,
    status,
    rawCode: typeof code === "string" ? code : null,
    message,
  });
};

/** `Retry-After`: delta-seconds 또는 HTTP-date → 남은 초(0 이상 정수) */
export const parseRetryAfter = (
  value: string | null,
  now: number = Date.now(),
): number | null => {
  if (value == null) return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  // HTTP-date는 요일·월 이름이 있다. 숫자만 있는 다른 값("-1" 등)을 Date.parse가 연도로 읽지 않게 한다.
  const date = /[A-Za-z]/.test(trimmed) ? Date.parse(trimmed) : NaN;
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - now) / 1000));
};
