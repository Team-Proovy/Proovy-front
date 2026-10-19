// @vitest-environment node
import { describe, expect, it } from "vitest";
import { RUN_ERROR_CODES } from "@/shared/contracts/browser_run_v1";
import { getErrorFixture } from "@/test/contracts/browser_run_fixtures";
import {
  parseRetryAfter,
  readRunApiError,
  RunApiError,
  toRunApiError,
} from "./run_api_error";
import { jsonResponse } from "./test_streams";

describe("toRunApiError — fixture responses/valid 오류 예제", () => {
  it.each(
    RUN_ERROR_CODES.map((code) => [code, getErrorFixture(code)] as const),
  )("%s → HTTP status·code·message", (code, fixture) => {
    const error = toRunApiError(fixture.http, fixture.body);
    expect(error).toBeInstanceOf(RunApiError);
    expect(error.status).toBe(fixture.http);
    expect(error.code).toBe(code);
    expect(error.message).toBe(fixture.body.message);
  });

  it("RUN4091 → activeRunId", () => {
    const fixture = getErrorFixture("RUN4091");
    const error = toRunApiError(fixture.http, fixture.body);
    expect(error.detail).toEqual({
      code: "RUN4091",
      status: 409,
      message: fixture.body.message,
      activeRunId: "eeff258f-0aa4-5728-a27a-3c05ac927a57",
    });
  });

  it("RUN4291 → Retry-After header(초)", async () => {
    const fixture = getErrorFixture("RUN4291");
    const error = await readRunApiError(
      jsonResponse(fixture.http, fixture.body, { "Retry-After": "30" }),
    );
    expect(error.detail).toEqual({
      code: "RUN4291",
      status: 429,
      message: fixture.body.message,
      retryAfterSeconds: 30,
    });
  });

  it("RUN4291에 Retry-After가 없으면 null", () => {
    const fixture = getErrorFixture("RUN4291");
    expect(toRunApiError(fixture.http, fixture.body).detail).toMatchObject({
      retryAfterSeconds: null,
    });
  });
});

describe("toRunApiError — 계약 밖 응답", () => {
  it("RUN4091인데 activeRunId가 없으면 계약 밖(code null)", () => {
    const error = toRunApiError(409, {
      isSuccess: false,
      code: "RUN4091",
      message: "이 노트에서 진행 중인 답변이 있습니다.",
    });
    expect(error.detail).toMatchObject({ code: null, rawCode: "RUN4091" });
  });

  it("COMMON500 JSON은 rawCode로 남긴다", () => {
    const error = toRunApiError(500, {
      isSuccess: false,
      code: "COMMON500",
      message: "서버 오류",
    });
    expect(error.detail).toEqual({
      code: null,
      status: 500,
      rawCode: "COMMON500",
      message: "서버 오류",
    });
  });

  it("JSON이 아닌 본문(proxy 502 HTML)", async () => {
    const error = await readRunApiError(
      new Response("<html>Bad Gateway</html>", { status: 502 }),
    );
    expect(error.detail).toEqual({
      code: null,
      status: 502,
      rawCode: null,
      message: null,
    });
    expect(error.message).toBe("HTTP 502 계약 밖 응답");
  });
});

describe("parseRetryAfter", () => {
  const now = Date.parse("2026-10-20T00:00:00Z");

  it.each([
    ["0", 0],
    ["120", 120],
    [" 5 ", 5],
    ["Tue, 20 Oct 2026 00:00:30 GMT", 30],
    ["Mon, 19 Oct 2026 23:59:00 GMT", 0],
    ["-1", null],
    ["soon", null],
    [null, null],
  ])("%s → %s", (value, expected) => {
    expect(parseRetryAfter(value, now)).toBe(expected);
  });
});
