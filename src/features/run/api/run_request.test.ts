// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  listInvalidRequestFixtures,
  listRequestFixtures,
  readContractJson,
} from "@/test/contracts/browser_run_fixtures";
import {
  countCodePoints,
  createConversationRequest,
  createRequestId,
  stripPythonWhitespace,
  validateConversationRequest,
} from "./run_request";

const LOWERCASE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("validateConversationRequest — fixture requests", () => {
  it.each(
    listRequestFixtures().map((fixture) => [fixture.name, fixture] as const),
  )("valid %s → 통과", (_name, fixture) => {
    expect(validateConversationRequest(fixture.request)).toEqual({
      ok: true,
      request: fixture.request,
    });
  });

  it.each(
    listInvalidRequestFixtures().map(
      (fixture) => [fixture.name, fixture] as const,
    ),
  )("invalid %s → 거부(기대 code)", (_name, fixture) => {
    const result = validateConversationRequest(fixture.request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(fixture.expected.code);
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("valid 10개·invalid 43개를 모두 검사한다", () => {
    expect(listRequestFixtures()).toHaveLength(10);
    expect(listInvalidRequestFixtures()).toHaveLength(43);
  });

  it("값이 undefined인 선택 키는 JSON에 실리지 않으므로 없는 것과 같다", () => {
    expect(
      validateConversationRequest({
        requestId: "7f460a7b-bf54-570e-a3af-b63a26435627",
        text: "a",
        noteId: undefined,
        turnAttachmentIds: undefined,
      }).ok,
    ).toBe(true);
  });

  it("구조 위반과 video가 함께 있으면 RUN4001이 먼저다", () => {
    const result = validateConversationRequest({
      requestId: "7f460a7b-bf54-570e-a3af-b63a26435627",
      text: "풀어줘",
      requestedOutputs: ["video"],
      locale: "ko",
    });
    expect(result).toMatchObject({ ok: false, code: "RUN4001" });
  });
});

describe("strip·code point 경계", () => {
  // CATALOG의 Python str.strip() 집합
  const stripSet = [
    "\t",
    "\n",
    "\v",
    "\f",
    "\r",
    "\u001c",
    "\u001d",
    "\u001e",
    "\u001f",
    " ",
    "\u0085",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    "　",
  ];

  it.each(stripSet.map((char) => [char.codePointAt(0)!.toString(16), char]))(
    "U+%s는 양끝에서 지운다",
    (_hex, char) => {
      expect(stripPythonWhitespace(`${char}${char}가${char}나${char}`)).toBe(
        `가${char}나`,
      );
    },
  );

  it("JS trim이 지우는 U+FEFF는 Python strip 집합이 아니라 남긴다", () => {
    expect("﻿가".trim()).toBe("가");
    expect(stripPythonWhitespace("﻿가")).toBe("﻿가");
    expect(
      validateConversationRequest({
        requestId: "7f460a7b-bf54-570e-a3af-b63a26435627",
        text: "﻿",
      }).ok,
    ).toBe(true);
  });

  it("strip 집합 공백만 있는 text는 거부한다", () => {
    expect(
      validateConversationRequest({
        requestId: "7f460a7b-bf54-570e-a3af-b63a26435627",
        text: stripSet.join(""),
      }),
    ).toMatchObject({ ok: false, code: "RUN4001" });
  });

  const requestWith = (text: string, latex?: string) => ({
    requestId: "7f460a7b-bf54-570e-a3af-b63a26435627",
    text,
    ...(latex !== undefined && { latex }),
  });

  it("astral 문자는 code point 하나로 센다(JS .length 아님)", () => {
    const astral = "\u{1d465}";
    const atLimit = astral.repeat(10000);
    expect(atLimit.length).toBe(20000);
    expect(countCodePoints(atLimit)).toBe(10000);
    expect(validateConversationRequest(requestWith(atLimit)).ok).toBe(true);
    expect(
      validateConversationRequest(requestWith(atLimit + astral)),
    ).toMatchObject({
      ok: false,
      code: "RUN4001",
    });
  });

  it("상한은 strip 뒤 길이로 본다 — text·latex 각각", () => {
    const atLimit = "가".repeat(10000);
    const blanks = "　  ";
    expect(
      validateConversationRequest(requestWith(`${blanks}${atLimit}${blanks}`))
        .ok,
    ).toBe(true);
    expect(validateConversationRequest(requestWith(`${atLimit}가`)).ok).toBe(
      false,
    );
    expect(
      validateConversationRequest(
        requestWith("a", `${blanks}${atLimit}${blanks}`),
      ).ok,
    ).toBe(true);
    expect(
      validateConversationRequest(requestWith("a", `${atLimit}가`)).ok,
    ).toBe(false);
    expect(validateConversationRequest(requestWith("a", blanks)).ok).toBe(
      false,
    );
  });
});

describe("createConversationRequest", () => {
  it("새 질문마다 새 소문자 UUID requestId를 만든다", () => {
    const first = createConversationRequest({ text: "풀어줘" });
    const second = createConversationRequest({ text: "풀어줘" });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.request.requestId).toMatch(LOWERCASE_UUID);
      expect(second.request.requestId).toMatch(LOWERCASE_UUID);
      expect(first.request.requestId).not.toBe(second.request.requestId);
    }
  });

  it("첫 질문은 noteId 키 없이 만든다", () => {
    for (const noteId of [undefined, null]) {
      const result = createConversationRequest({ noteId, text: "풀어줘" });
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(Object.keys(result.request)).toEqual(["requestId", "text"]);
    }
  });

  it("fixture first-no-note와 같은 body를 만든다", () => {
    const fixture = readContractJson<{ request: Record<string, unknown> }>(
      "requests/valid/first-no-note.json",
    ).request;
    const result = createConversationRequest(
      { text: fixture.text as string },
      () => fixture.requestId as string,
    );
    expect(result).toEqual({ ok: true, request: fixture });
  });

  it("fixture existing-note-full의 모든 선택 필드를 그대로 싣는다", () => {
    const fixture = listRequestFixtures().find(
      (item) => item.name === "existing-note-full",
    )!.request;
    const { requestId, ...input } = fixture;
    expect(createConversationRequest(input, () => requestId)).toEqual({
      ok: true,
      request: fixture,
    });
  });

  it("text·latex를 strip하고 strip 뒤 빈 latex는 뺀다", () => {
    const result = createConversationRequest({
      noteId: "123",
      text: "  풀어줘\n",
      latex: " 　",
    });
    expect(result).toMatchObject({
      ok: true,
      request: { noteId: "123", text: "풀어줘" },
    });
    if (result.ok) expect("latex" in result.request).toBe(false);
  });

  it("검증에 실패하면 이유를 돌려준다", () => {
    expect(createConversationRequest({ text: " " })).toMatchObject({
      ok: false,
      code: "RUN4001",
      issues: [{ path: "text" }],
    });
    expect(
      createConversationRequest({ text: "a", requestedOutputs: ["video"] }),
    ).toMatchObject({ ok: false, code: "RUN4002" });
  });

  it("같은 전송 재시도는 만든 요청을 그대로 쓴다(입력 배열을 고쳐도 영향 없음)", () => {
    const tasks: ("solve" | "check")[] = ["solve"];
    const result = createConversationRequest({
      text: "a",
      requestedTasks: tasks,
    });
    tasks.push("check");
    expect(result.ok && result.request.requestedTasks).toEqual(["solve"]);
  });
});

describe("createRequestId", () => {
  it("crypto.randomUUID가 없어도 소문자 UUID v4를 만든다", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
    try {
      const ids = Array.from({ length: 50 }, createRequestId);
      for (const id of ids) {
        expect(id).toMatch(LOWERCASE_UUID);
        expect(id[14]).toBe("4");
        expect("89ab").toContain(id[19]);
      }
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      Object.defineProperty(crypto, "randomUUID", {
        value: original,
        configurable: true,
      });
    }
  });
});
