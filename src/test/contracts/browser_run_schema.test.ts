import { describe, expect, it } from "vitest";
import {
  listInvalidRequestFixtures,
  listInvalidResponseFixtures,
  listInvalidStreamFixtures,
  listRequestFixtures,
  listResponseFixtures,
  listStreamFixtures,
  readContractJson,
} from "./browser_run_fixtures";
import { validateWire } from "./browser_run_schema";

// schema `NoInternalKeys`가 거부하는 내부 키 (camelCase·snake_case)
const INTERNAL_KEYS = [
  "attempt",
  "fenceToken",
  "fence_token",
  "sourceEventId",
  "source_event_id",
  "failureClass",
  "failure_class",
  "requestFingerprint",
  "usage",
  "deadline",
];

const clone = <T>(value: T): T => structuredClone(value);

/** manifest에 나열된 `browser-run-v1/{directory}/*.json` fixture 이름 */
const readValidNames = (directory: string) => {
  const prefix = `${directory}/`;
  const manifest = readContractJson<{ files: Record<string, string> }>(
    "manifest.json",
  );
  return Object.keys(manifest.files)
    .map((filePath) => filePath.replace(/^browser-run-v1\//, ""))
    .filter((filePath) => filePath.startsWith(prefix))
    .map((filePath) => filePath.slice(prefix.length).replace(/\.json$/, ""));
};

describe("valid fixture는 schema를 통과한다", () => {
  it.each(readValidNames("streams/valid"))("streams/valid/%s", (name) => {
    const raw = readContractJson<{ frames: unknown[]; live?: unknown[] }>(
      `streams/valid/${name}.json`,
    );
    for (const frame of [...raw.frames, ...(raw.live ?? [])]) {
      expect(validateWire("BrowserFrame", frame)).toMatchObject({
        isValid: true,
      });
    }
  });

  it.each(readValidNames("responses/valid"))("responses/valid/%s", (name) => {
    const raw = readContractJson<{
      schema: "RunStatusResponse";
      body: unknown;
    }>(`responses/valid/${name}.json`);
    expect(validateWire(raw.schema, raw.body)).toMatchObject({ isValid: true });
  });

  it.each(readValidNames("requests/valid"))("requests/valid/%s", (name) => {
    const raw = readContractJson<{ request: unknown }>(
      `requests/valid/${name}.json`,
    );
    expect(validateWire("ConversationRunRequest", raw.request)).toMatchObject({
      isValid: true,
    });
  });

  it("fixture 로더가 모든 valid fixture를 타입을 붙여 읽는다", () => {
    expect(listStreamFixtures()).toHaveLength(10);
    expect(listResponseFixtures()).toHaveLength(28);
    expect(listRequestFixtures()).toHaveLength(10);
  });
});

describe("invalid fixture", () => {
  const invalidRequests = listInvalidRequestFixtures();
  const invalidStreams = listInvalidStreamFixtures();

  it.each(
    invalidRequests
      .filter((fixture) => fixture.schemaRejects)
      .map((f) => [f.name, f]),
  )("requests/invalid/%s는 schema가 거부한다", (_name, fixture) => {
    expect(
      validateWire("ConversationRunRequest", fixture.request).isValid,
    ).toBe(false);
  });

  it.each(
    invalidRequests
      .filter((fixture) => !fixture.schemaRejects)
      .map((f) => [f.name, f]),
  )(
    "requests/invalid/%s는 schema를 통과한다(계약 검사 대상)",
    (_name, fixture) => {
      expect(
        validateWire("ConversationRunRequest", fixture.request).isValid,
      ).toBe(true);
    },
  );

  it.each(listInvalidResponseFixtures().map((f) => [f.name, f]))(
    "responses/invalid/%s는 schema가 거부한다",
    (_name, fixture) => {
      expect(validateWire(fixture.schema, fixture.body).isValid).toBe(false);
    },
  );

  it.each(
    invalidStreams
      .filter((fixture) => fixture.schemaRejects)
      .map((f) => [f.name, f]),
  )(
    "streams/invalid/%s는 frame 하나 이상을 schema가 거부한다",
    (_name, fixture) => {
      const rejectedFrames = fixture.frames.filter(
        (frame) => !validateWire("BrowserFrame", frame).isValid,
      );
      expect(rejectedFrames.length).toBeGreaterThan(0);
    },
  );

  it.each(
    invalidStreams
      .filter((fixture) => !fixture.schemaRejects)
      .map((f) => [f.name, f]),
  )(
    "streams/invalid/%s는 frame마다 schema를 통과한다(순서 규칙 위반)",
    (_name, fixture) => {
      for (const frame of fixture.frames) {
        expect(validateWire("BrowserFrame", frame).isValid).toBe(true);
      }
    },
  );
});

describe("additive-tolerant 응답·이벤트", () => {
  it("모든 valid frame에 알 수 없는 필드를 더해도 통과한다", () => {
    for (const stream of listStreamFixtures()) {
      for (const frame of stream.frames) {
        const extended = clone(frame) as unknown as Record<
          string,
          Record<string, unknown>
        >;
        extended.futureField = { nested: true };
        extended.payload.futureField = "added later";
        expect(validateWire("BrowserFrame", extended).isValid).toBe(true);
      }
    }
  });

  it("모든 valid 응답의 envelope·result에 알 수 없는 필드를 더해도 통과한다", () => {
    for (const fixture of listResponseFixtures()) {
      const extended = clone(fixture.body) as unknown as Record<
        string,
        unknown
      >;
      extended.futureField = 1;
      if (extended.result && typeof extended.result === "object") {
        (extended.result as Record<string, unknown>).futureField = 1;
      }
      expect(validateWire(fixture.schema, extended).isValid).toBe(true);
    }
  });

  it("요청 body는 closed라 알 수 없는 필드를 거부한다", () => {
    const [fixture] = listRequestFixtures();
    expect(
      validateWire("ConversationRunRequest", {
        ...fixture.request,
        futureField: 1,
      }).isValid,
    ).toBe(false);
  });
});

describe("내부 키는 frame·payload·응답 어디에서도 거부된다", () => {
  const [stream] = listStreamFixtures();
  const runCreatedFrame = stream.frames[0];
  const statusFixture = listResponseFixtures().find(
    (fixture) => fixture.schema === "RunStatusResponse",
  )!;

  it.each(INTERNAL_KEYS)("%s", (internalKey) => {
    expect(
      validateWire("BrowserFrame", { ...runCreatedFrame, [internalKey]: "x" })
        .isValid,
    ).toBe(false);
    expect(
      validateWire("BrowserFrame", {
        ...runCreatedFrame,
        payload: { ...runCreatedFrame.payload, [internalKey]: "x" },
      }).isValid,
    ).toBe(false);
    expect(
      validateWire("RunStatusResponse", {
        ...statusFixture.body,
        result: { ...statusFixture.body.result, [internalKey]: "x" },
      }).isValid,
    ).toBe(false);
  });
});

describe("공개 run status", () => {
  const statusFixture = listResponseFixtures().find(
    (fixture) => fixture.name === "status-running",
  )!;

  it.each(["RETRYING", "QUEUED", "running"])("%s는 거부한다", (status) => {
    expect(
      validateWire("RunStatusResponse", {
        ...statusFixture.body,
        result: { ...statusFixture.body.result, status },
      }).isValid,
    ).toBe(false);
  });
});
