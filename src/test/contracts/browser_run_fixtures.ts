import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type {
  BrowserFrame,
  ConversationPageResponse,
  ConversationRunRequest,
  RunCancelResponse,
  RunErrorCode,
  RunErrorResponse,
  RunStatusResponse,
  TerminalRunStatus,
  Uuid,
} from "@/shared/contracts/browser_run_v1";
import { CONTRACT_MIRROR_DIR } from "./contract_mirror";
import { parseWire } from "./browser_run_schema";

/**
 * browser-run-v1 fixture 로더 (테스트 전용).
 *
 * valid fixture는 읽을 때 schema를 통과시킨 뒤 공용 wire 타입을 붙여 돌려준다.
 * 계약은 "runId = 시나리오"다. 같은 run을 설명하는 stream·상태·취소·대화 조회 fixture가
 * runId를 공유하므로 `getRunScenario(runId)`로 한 시나리오를 모아 꺼낼 수 있다.
 * invalid fixture는 색인하지 않고 원본 값(`unknown`)을 그대로 준다.
 *
 * fixture 이름은 파일명에서 `.json`을 뺀 값이다(예: `substantive-completed`).
 */

const FIXTURE_ROOT = path.join(CONTRACT_MIRROR_DIR, "browser-run-v1");

/** `browser-run-v1/` 기준 경로의 JSON을 그대로 읽는다(검사 없음). */
export const readContractJson = <T = unknown>(relativePath: string) =>
  JSON.parse(readFileSync(path.join(FIXTURE_ROOT, relativePath), "utf8")) as T;

/** `browser-run-v1/` 기준 경로의 텍스트를 그대로 읽는다. */
export const readContractText = (relativePath: string) =>
  readFileSync(path.join(FIXTURE_ROOT, relativePath), "utf8");

const listFixtureNames = (directory: string) =>
  readdirSync(path.join(FIXTURE_ROOT, directory))
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => fileName.replace(/\.json$/, ""))
    .sort();

const memoize = <T>(load: () => T) => {
  let cached: { value: T } | undefined;
  return () => (cached ??= { value: load() }).value;
};

const indexByName = <T extends { name: string }>(
  fixtures: T[],
  kind: string,
) => {
  const fixtureMap = new Map(
    fixtures.map((fixture) => [fixture.name, fixture]),
  );
  return (name: string) => {
    const fixture = fixtureMap.get(name);
    if (!fixture) throw new Error(`${kind} fixture 없음: ${name}`);
    return fixture;
  };
};

// ---------------------------------------------------------------------------
// streams
// ---------------------------------------------------------------------------

export interface StreamFixture {
  name: string;
  rationale: string;
  runId: Uuid;
  finalStatus: TerminalRunStatus;
  /** durable frame 전체(seq 1부터) */
  frames: BrowserFrame[];
  /** 같은 frame의 SSE 원문. event/id 줄은 byte 비교, data 줄은 JSON 의미 비교 대상이다. */
  sse: string;
  sseNote: string;
  /** replay fixture만: 같은 run의 live frame. `allowedDifference` 외에는 `frames`와 같다. */
  live?: BrowserFrame[];
  allowedDifference?: string;
}

export interface InvalidStreamFixture {
  name: string;
  rationale: string;
  /** 위반한 stream 규칙 S1~S7 (`manifest.stream_rules`) */
  violates: string;
  /** true면 frame 하나가 BrowserFrame schema에서 거부된다(S7). false면 순서 규칙 위반이다. */
  schemaRejects: boolean;
  frames: unknown[];
}

interface RawStreamFixture {
  rationale: string;
  runId: Uuid;
  finalStatus: TerminalRunStatus;
  frames: unknown[];
  sse: string;
  sseNote: string;
  live?: unknown[];
  allowedDifference?: string;
}

const parseFrames = (frames: unknown[], label: string) =>
  frames.map((frame, index) =>
    parseWire("BrowserFrame", frame, `${label} frames[${index}]`),
  );

export const listStreamFixtures = memoize(() =>
  listFixtureNames("streams/valid").map((name): StreamFixture => {
    const raw = readContractJson<RawStreamFixture>(
      `streams/valid/${name}.json`,
    );
    return {
      name,
      rationale: raw.rationale,
      runId: raw.runId,
      finalStatus: raw.finalStatus,
      frames: parseFrames(raw.frames, `streams/valid/${name}`),
      sse: raw.sse,
      sseNote: raw.sseNote,
      ...(raw.live && {
        live: parseFrames(raw.live, `streams/valid/${name} live`),
      }),
      ...(raw.allowedDifference && {
        allowedDifference: raw.allowedDifference,
      }),
    };
  }),
);

const findStreamFixture = memoize(() =>
  indexByName(listStreamFixtures(), "stream"),
);
export const getStreamFixture = (name: string) => findStreamFixture()(name);

export const listInvalidStreamFixtures = memoize(() =>
  listFixtureNames("streams/invalid").map((name): InvalidStreamFixture => {
    const raw = readContractJson<{
      rationale: string;
      violates: string;
      schema_rejects: boolean;
      frames: unknown[];
    }>(`streams/invalid/${name}.json`);
    return {
      name,
      rationale: raw.rationale,
      violates: raw.violates,
      schemaRejects: raw.schema_rejects,
      frames: raw.frames,
    };
  }),
);

/** live heartbeat 원문(`: heartbeat\n\n`)과 heartbeat로 취급하면 안 되는 SSE 예제 */
export const getHeartbeatFixture = memoize(() => {
  const invalid = readContractJson<{
    valid: string;
    cases: { name: string; rationale: string; sse: string }[];
  }>("heartbeat-invalid.json");
  return {
    comment: readContractText("heartbeat.txt"),
    invalidCases: invalid.cases,
  };
});

// ---------------------------------------------------------------------------
// responses
// ---------------------------------------------------------------------------

export type ResponseSchemaName =
  | "RunStatusResponse"
  | "RunCancelResponse"
  | "ConversationPageResponse"
  | "ErrorResponse";

interface ResponseBodyTypes {
  RunStatusResponse: RunStatusResponse;
  RunCancelResponse: RunCancelResponse;
  ConversationPageResponse: ConversationPageResponse;
  ErrorResponse: RunErrorResponse;
}

interface ResponseFixtureOf<N extends ResponseSchemaName> {
  name: string;
  schema: N;
  http: number;
  body: ResponseBodyTypes[N];
  /** 상태 fixture만: 같은 run의 `streams/valid` fixture 이름 */
  stream?: string;
}

export type RunStatusFixture = ResponseFixtureOf<"RunStatusResponse">;
export type RunCancelFixture = ResponseFixtureOf<"RunCancelResponse">;
export type ConversationFixture = ResponseFixtureOf<"ConversationPageResponse">;
export type ErrorFixture = ResponseFixtureOf<"ErrorResponse">;
export type ResponseFixture =
  | RunStatusFixture
  | RunCancelFixture
  | ConversationFixture
  | ErrorFixture;

export interface InvalidResponseFixture {
  name: string;
  schema: ResponseSchemaName;
  rationale: string;
  body: unknown;
}

export const listResponseFixtures = memoize(() =>
  listFixtureNames("responses/valid").map((name) => {
    const raw = readContractJson<{
      schema: ResponseSchemaName;
      http: number;
      body: unknown;
      stream?: string;
    }>(`responses/valid/${name}.json`);
    return {
      name,
      schema: raw.schema,
      http: raw.http,
      body: parseWire(raw.schema, raw.body, `responses/valid/${name}`),
      ...(raw.stream && { stream: raw.stream }),
    } as ResponseFixture;
  }),
);

const findResponseFixture = memoize(() =>
  indexByName(listResponseFixtures(), "response"),
);
export const getResponseFixture = (name: string) => findResponseFixture()(name);

const getResponseFixtureOf =
  <N extends ResponseSchemaName>(schema: N) =>
  (name: string) => {
    const fixture = getResponseFixture(name);
    if (fixture.schema !== schema) {
      throw new Error(
        `${name}은(는) ${schema}가 아니라 ${fixture.schema} fixture다`,
      );
    }
    return fixture as ResponseFixtureOf<N>;
  };

/** 예: `getRunStatusFixture("status-running")` */
export const getRunStatusFixture = getResponseFixtureOf("RunStatusResponse");
/** 예: `getRunCancelFixture("cancel-accepted-running")` */
export const getRunCancelFixture = getResponseFixtureOf("RunCancelResponse");
/** 예: `getConversationFixture("conversation-active-run")` */
export const getConversationFixture = getResponseFixtureOf(
  "ConversationPageResponse",
);
/** 예: `getErrorFixture("RUN4091")` — code로 찾는다. */
export const getErrorFixture = (code: RunErrorCode) =>
  getResponseFixtureOf("ErrorResponse")(`error-${code.toLowerCase()}`);

export const listInvalidResponseFixtures = memoize(() =>
  listFixtureNames("responses/invalid").map(
    (name): InvalidResponseFixture => ({
      name,
      ...readContractJson<Omit<InvalidResponseFixture, "name">>(
        `responses/invalid/${name}.json`,
      ),
    }),
  ),
);

// ---------------------------------------------------------------------------
// requests
// ---------------------------------------------------------------------------

export interface RequestFixture {
  name: string;
  rationale: string;
  request: ConversationRunRequest;
  /** Server fingerprint 입력 canonical JSON (Front는 계산하지 않는다) */
  expectedCanonical: string;
  expectedFingerprint: string;
}

export interface InvalidRequestFixture {
  name: string;
  rationale: string;
  request: unknown;
  /** false면 schema는 통과하고 계약 검사(길이·selection·video)가 거부한다. */
  schemaRejects: boolean;
  expected: { http: number; code: RunErrorCode };
}

export const listRequestFixtures = memoize(() =>
  listFixtureNames("requests/valid").map((name): RequestFixture => {
    const raw = readContractJson<{
      rationale: string;
      request: unknown;
      expected_canonical: string;
      expected_fingerprint: string;
    }>(`requests/valid/${name}.json`);
    return {
      name,
      rationale: raw.rationale,
      request: parseWire(
        "ConversationRunRequest",
        raw.request,
        `requests/valid/${name}`,
      ),
      expectedCanonical: raw.expected_canonical,
      expectedFingerprint: raw.expected_fingerprint,
    };
  }),
);

const findRequestFixture = memoize(() =>
  indexByName(listRequestFixtures(), "request"),
);
export const getRequestFixture = (name: string) => findRequestFixture()(name);

export const listInvalidRequestFixtures = memoize(() =>
  listFixtureNames("requests/invalid").map((name): InvalidRequestFixture => {
    const raw = readContractJson<{
      rationale: string;
      request: unknown;
      schema_rejects: boolean;
      expected: { http: number; code: RunErrorCode };
    }>(`requests/invalid/${name}.json`);
    return {
      name,
      rationale: raw.rationale,
      request: raw.request,
      schemaRejects: raw.schema_rejects,
      expected: raw.expected,
    };
  }),
);

// ---------------------------------------------------------------------------
// 판정표 (cursor·cancel·admission)
// ---------------------------------------------------------------------------

export interface CursorCaseRun {
  runId: Uuid;
  status: string;
  lastDurableSeq: number;
  stream?: string;
}

export interface CursorCase {
  name: string;
  /** `runs`의 key 또는 `missing`·`other_user` */
  run: string;
  lastEventIdHeader: string | null;
  lastEventIdQuery: string | null;
  schemaRejects: boolean;
  expected: {
    http: number;
    code?: RunErrorCode;
    replayFromSeq?: number;
    thenLive?: boolean;
  };
}

/** `GET /api/ai-runs/{runId}/events` cursor 판정표 */
export const getCursorCases = memoize(() =>
  readContractJson<{
    runs: Record<string, CursorCaseRun>;
    thenLiveRule: string;
    cases: CursorCase[];
  }>("cursors/cases.json"),
);

export interface CancelCase {
  name: string;
  rationale: string;
  rawBody: string | null;
  run: string;
  expected: {
    http: number;
    code?: RunErrorCode;
    /** `responses/valid/...` 경로 */
    fixture?: string;
    status?: string;
  };
}

/** `POST /api/ai-runs/{runId}/cancel` 판정표 */
export const getCancelCases = memoize(() =>
  readContractJson<{ path: string; precedence: string[]; cases: CancelCase[] }>(
    "cancel/cases.json",
  ),
);

/** `POST /api/conversations` 접수 판정표(Server 판정 순서 참고용) */
export const getAdmissionDecisions = memoize(() =>
  readContractJson<{
    precedence: string[];
    cases: {
      name: string;
      rationale: string;
      state: Record<string, unknown>;
      expected: Record<string, unknown>;
    }[];
  }>("admission/decisions.json"),
);

// ---------------------------------------------------------------------------
// runId 색인
// ---------------------------------------------------------------------------

export interface RunScenario {
  runId: Uuid;
  /** 이 run의 stream (live와 replay 변형이 함께 있을 수 있다) */
  streams: StreamFixture[];
  /** 이 run의 상태 조회 응답 (진행 중 run은 시점 snapshot이라 여러 개일 수 있다) */
  statuses: RunStatusFixture[];
  cancels: RunCancelFixture[];
  /** 이 run의 메시지나 activeRun을 담은 대화 조회 응답 */
  conversations: ConversationFixture[];
  /** `activeRunId`가 이 run인 RUN4091 응답 */
  activeRunConflicts: ErrorFixture[];
  /** cursor 판정표 `runs`에서 이 run을 가리키는 key */
  cursorRunKeys: string[];
}

const collectResponseRunIds = (fixture: ResponseFixture) => {
  switch (fixture.schema) {
    case "RunStatusResponse":
    case "RunCancelResponse":
      return [fixture.body.result.runId];
    case "ConversationPageResponse": {
      const page = fixture.body.result;
      const runIds = page.messages.map((message) => message.runId);
      if (page.activeRun) runIds.push(page.activeRun.runId);
      return runIds;
    }
    case "ErrorResponse":
      return fixture.body.code === "RUN4091"
        ? [fixture.body.result.activeRunId]
        : [];
  }
};

const buildRunScenarioIndex = memoize(() => {
  const scenarios = new Map<Uuid, RunScenario>();
  const getOrCreate = (runId: Uuid) => {
    let scenario = scenarios.get(runId);
    if (!scenario) {
      scenario = {
        runId,
        streams: [],
        statuses: [],
        cancels: [],
        conversations: [],
        activeRunConflicts: [],
        cursorRunKeys: [],
      };
      scenarios.set(runId, scenario);
    }
    return scenario;
  };

  for (const stream of listStreamFixtures())
    getOrCreate(stream.runId).streams.push(stream);

  for (const fixture of listResponseFixtures()) {
    for (const runId of new Set(collectResponseRunIds(fixture))) {
      const scenario = getOrCreate(runId);
      if (fixture.schema === "RunStatusResponse")
        scenario.statuses.push(fixture);
      if (fixture.schema === "RunCancelResponse")
        scenario.cancels.push(fixture);
      if (fixture.schema === "ConversationPageResponse")
        scenario.conversations.push(fixture);
      if (fixture.schema === "ErrorResponse")
        scenario.activeRunConflicts.push(fixture);
    }
  }

  for (const [runKey, run] of Object.entries(getCursorCases().runs)) {
    getOrCreate(run.runId).cursorRunKeys.push(runKey);
  }

  return scenarios;
});

/** valid fixture에 등장하는 모든 run 시나리오 */
export const listRunScenarios = () => [...buildRunScenarioIndex().values()];

export const getRunScenario = (runId: Uuid) => {
  const scenario = buildRunScenarioIndex().get(runId);
  if (!scenario) throw new Error(`runId ${runId}를 쓰는 valid fixture 없음`);
  return scenario;
};

/** stream fixture 이름으로 그 run의 시나리오를 찾는다. 예: `getRunScenarioByStream("canceled-pending")` */
export const getRunScenarioByStream = (streamName: string) =>
  getRunScenario(getStreamFixture(streamName).runId);
