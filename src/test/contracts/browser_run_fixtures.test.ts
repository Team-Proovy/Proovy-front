import { describe, expect, it } from "vitest";
import {
  isTerminalFrame,
  toEventId,
  type BrowserFrame,
} from "@/shared/contracts/browser_run_v1";
import {
  getCancelCases,
  getConversationFixture,
  getCursorCases,
  getErrorFixture,
  getHeartbeatFixture,
  getRequestFixture,
  getRunScenario,
  getRunScenarioByStream,
  getRunStatusFixture,
  getStreamFixture,
  listInvalidStreamFixtures,
  listRunScenarios,
  listStreamFixtures,
} from "./browser_run_fixtures";

// SSE 블록을 frame 비교용으로 단순 분해한다(1.89 reader 구현이 아니다).
const parseSseBlocks = (sse: string) =>
  sse
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const fields = new Map<string, string>();
      for (const line of block.split("\n")) {
        const separatorIndex = line.indexOf(": ");
        fields.set(
          line.slice(0, separatorIndex),
          line.slice(separatorIndex + 2),
        );
      }
      return fields;
    });

const withoutAvailability = (frames: BrowserFrame[]) =>
  frames.map((frame) => {
    if (frame.type !== "run.completed") return frame;
    const copied = structuredClone(frame);
    for (const reference of copied.payload.assistantResponse.sourceReferences ??
      []) {
      reference.available = true;
    }
    return copied;
  });

describe("stream fixture", () => {
  it.each(listStreamFixtures().map((fixture) => [fixture.name, fixture]))(
    "%s: seq 1부터 빈틈없고 terminal로 끝나며 runId가 같다",
    (_name, fixture) => {
      expect(fixture.frames[0].type).toBe("run.created");
      expect(fixture.frames.map((frame) => frame.seq)).toEqual(
        fixture.frames.map((_, index) => index + 1),
      );
      expect(
        fixture.frames.every((frame) => frame.runId === fixture.runId),
      ).toBe(true);
      expect(fixture.frames.filter(isTerminalFrame)).toEqual([
        fixture.frames.at(-1),
      ]);
    },
  );

  it.each(listStreamFixtures().map((fixture) => [fixture.name, fixture]))(
    "%s: sse 원문의 event·id·data가 frames와 같다",
    (_name, fixture) => {
      const blocks = parseSseBlocks(fixture.sse);
      expect(blocks.map((block) => block.get("event"))).toEqual(
        fixture.frames.map((frame) => frame.type),
      );
      expect(blocks.map((block) => block.get("id"))).toEqual(
        fixture.frames.map((frame) => toEventId(frame.runId, frame.seq)),
      );
      expect(blocks.map((block) => JSON.parse(block.get("data")!))).toEqual(
        fixture.frames,
      );
    },
  );

  it("replay fixture는 live와 sourceReferences[].available만 다르다", () => {
    const replay = getStreamFixture("replay-source-unavailable");
    expect(replay.allowedDifference).toBe(
      "payload.assistantResponse.sourceReferences[].available",
    );
    expect(replay.live).toBeDefined();
    expect(replay.frames).not.toEqual(replay.live);
    expect(withoutAvailability(replay.frames)).toEqual(
      withoutAvailability(replay.live!),
    );
  });

  it("invalid stream은 위반 규칙과 함께 읽는다", () => {
    const seqGap = listInvalidStreamFixtures().find(
      (fixture) => fixture.name === "seq-gap",
    );
    expect(seqGap).toMatchObject({ violates: "S1", schemaRejects: false });
  });

  it("heartbeat comment와 거부 예제를 읽는다", () => {
    const heartbeat = getHeartbeatFixture();
    expect(heartbeat.comment).toBe(": heartbeat\n\n");
    expect(
      heartbeat.invalidCases.map((invalidCase) => invalidCase.name),
    ).toEqual([
      "heartbeat-with-id",
      "heartbeat-with-data",
      "heartbeat-as-event",
    ]);
  });
});

describe("runId 색인", () => {
  it("terminal 상태 fixture는 같은 run의 stream과 lastSeq·식별자가 같다", () => {
    for (const scenario of listRunScenarios()) {
      for (const statusFixture of scenario.statuses) {
        const status = statusFixture.body.result;
        if (!statusFixture.stream) continue;
        const stream = getStreamFixture(statusFixture.stream);
        const [runCreated] = stream.frames;
        expect(stream.runId).toBe(scenario.runId);
        expect(status.lastSeq).toBe(stream.frames.length);
        expect(status.status).toBe(stream.finalStatus);
        expect(
          runCreated.type === "run.created" && runCreated.payload,
        ).toMatchObject({
          requestId: status.requestId,
          userMessageId: status.userMessageId,
          assistantMessageId: status.assistantMessageId,
        });
      }
    }
  });

  it("완료 stream 시나리오에서 stream·상태·대화 조회를 함께 꺼낸다", () => {
    const scenario = getRunScenarioByStream("substantive-with-source");

    expect(scenario.streams.map((stream) => stream.name)).toEqual([
      "replay-source-unavailable",
      "substantive-with-source",
    ]);
    const assistantMessage = scenario.conversations
      .flatMap((conversation) => conversation.body.result.messages)
      .find(
        (message) =>
          message.runId === scenario.runId && message.role === "assistant",
      );
    expect(assistantMessage?.status).toBe("COMPLETED");
  });

  it("진행 중 시나리오에서 상태·취소·409·대화 조회·cursor run을 함께 꺼낸다", () => {
    const activeRunId = getCursorCases().runs.active.runId;
    const scenario = getRunScenario(activeRunId);

    expect(scenario.streams).toEqual([]);
    expect(scenario.statuses.map((fixture) => fixture.name)).toEqual([
      "status-running",
    ]);
    expect(scenario.cancels.map((fixture) => fixture.name)).toEqual([
      "cancel-accepted-running",
    ]);
    expect(
      scenario.activeRunConflicts.map((fixture) => fixture.body.code),
    ).toEqual(["RUN4091"]);
    expect(scenario.conversations.map((fixture) => fixture.name)).toEqual([
      "conversation-active-run",
    ]);
    expect(scenario.cursorRunKeys).toEqual(["active"]);
    expect(
      getConversationFixture("conversation-active-run").body.result.activeRun,
    ).toEqual({
      runId: activeRunId,
      status: "RUNNING",
      lastSeq: getRunStatusFixture("status-running").body.result.lastSeq,
    });
  });

  it("valid fixture가 없는 runId는 오류다", () => {
    expect(() =>
      getRunScenario("00000000-0000-0000-0000-000000000000"),
    ).toThrow(/valid fixture 없음/);
  });
});

describe("이름·code로 꺼내기", () => {
  it("응답 종류가 다르면 오류다", () => {
    expect(() => getRunStatusFixture("cancel-accepted-running")).toThrow(
      /RunCancelResponse/,
    );
  });

  it("오류 fixture를 code로 꺼낸다", () => {
    const fixture = getErrorFixture("RUN4091");
    expect(fixture.http).toBe(409);
    expect(
      fixture.body.code === "RUN4091" && fixture.body.result.activeRunId,
    ).toBe(getCursorCases().runs.active.runId);
    expect(getErrorFixture("RUN4291").http).toBe(429);
  });

  it("요청·판정표 fixture를 꺼낸다", () => {
    expect(getRequestFixture("first-no-note").request.noteId).toBeUndefined();
    expect(
      getCancelCases().cases.map((cancelCase) => cancelCase.name),
    ).toContain("pending");
  });
});
