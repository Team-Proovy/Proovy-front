import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { reduceFrames } from "@/features/run/model";
import { getStreamFixture } from "@/test/contracts/browser_run_fixtures";
import type {
  ConversationMessage,
  RunCreatedFrame,
} from "@/shared/contracts/browser_run_v1";
import { ConversationTurnView } from "../components/rightpanel/ConversationTurnView";
import { buildConversationTurns } from "./conversation_turns";

const fixture = getStreamFixture("substantive-completed");
const created = fixture.frames[0] as RunCreatedFrame;
const { requestId, userMessageId } = created.payload;
const runId = fixture.runId;
const input = { text: "질문" };

describe("buildConversationTurns", () => {
  it("접수 전 자리와 접수 뒤 run 자리가 같은 key(requestId)를 쓴다", () => {
    const pending = buildConversationTurns([], [], new Map(), {
      key: requestId,
      input,
    });
    const accepted = buildConversationTurns(
      [],
      [reduceFrames(fixture.frames.slice(0, 1))],
      new Map([[requestId, input]]),
      null,
    );
    expect(pending.map((turn) => turn.key)).toEqual([requestId]);
    expect(accepted.map((turn) => turn.key)).toEqual([requestId]);
    expect(accepted[0].user?.text).toBe("질문");
  });

  it("이력에 먼저 나온 run도 live run의 requestId를 key로 쓴다(이력 도착으로 remount하지 않는다)", () => {
    const history: ConversationMessage[] = [
      {
        messageId: userMessageId,
        role: "user",
        status: "COMPLETED",
        runId,
        createdAt: "2026-10-20T00:00:00Z",
        user: {
          text: "이력 질문",
          latex: null,
          requestedTasks: [],
          requestedOutputs: ["text"],
          turnAttachments: [],
          viewerFocus: null,
        },
      },
    ];
    const turns = buildConversationTurns(
      history,
      [reduceFrames(fixture.frames.slice(0, 3))],
      new Map(),
      null,
    );
    expect(turns).toHaveLength(1);
    expect(turns[0].key).toBe(requestId);
    expect(turns[0].user?.text).toBe("이력 질문");
    expect(turns[0].assistant?.kind).toBe("live");
  });
});

describe("ConversationTurnView user 수식", () => {
  const renderUser = (text: string, latex: string | null) =>
    render(
      <ConversationTurnView
        turn={{ key: "t", runId: null, user: { text, latex }, assistant: null }}
      />,
    ).container;

  it("text에 이미 있는 수식은 덧붙이지 않는다(여러 수식은 `; `로 나눠 본다)", () => {
    const container = renderUser("$x^2$ 와 $y^3$ 을 비교", "x^2; y^3");
    expect(container.querySelectorAll(".katex-display")).toHaveLength(0);
    expect(container.querySelectorAll(".katex")).toHaveLength(2);
  });

  it("text에 없는 수식만 수식 줄로 덧붙인다", () => {
    const container = renderUser("$x^2$ 을 풀어줘", "x^2; y^3");
    expect(container.querySelectorAll(".katex-display")).toHaveLength(1);
  });
});
