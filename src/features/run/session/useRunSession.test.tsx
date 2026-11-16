import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RunStreamEnd, RunStreamOptions } from "@/features/run/api";
import { selectActivities } from "@/features/run/model";
import { selectReExplanationText } from "@/features/run/model/run_selectors";
import type { BrowserFrame, EventId } from "@/shared/contracts/browser_run_v1";
import { getStreamFixture } from "@/test/contracts/browser_run_fixtures";
import { createRunSession } from "./run_session";
import type { RunSessionOptions } from "./run_session";
import { useRunSession } from "./useRunSession";

/** frame을 손으로 흘려보내는 api(React 갱신 확인용) */
const createManualApi = () => {
  let current: RunStreamOptions | null = null;
  let finish: (end: RunStreamEnd) => void = () => {};
  const reconnectCursors: (EventId | null | undefined)[] = [];
  const api: RunSessionOptions["api"] = {
    streamConversation: (_request, options) => {
      current = options;
      options.onOpen?.();
      return new Promise((resolve) => (finish = resolve));
    },
    streamRunEvents: (_runId, cursor, options) => {
      reconnectCursors.push(cursor.lastEventId);
      current = options;
      options.onOpen?.();
      return new Promise((resolve) => (finish = resolve));
    },
    cancelRun: () => Promise.reject(new Error("unused")),
    getConversationMessages: () => Promise.reject(new Error("unused")),
  };
  return {
    api,
    reconnectCursors,
    push: (frame: BrowserFrame) => current?.onFrame(frame),
    end: (end: RunStreamEnd) => finish(end),
  };
};

describe("useRunSession", () => {
  it("frame이 반영될 때마다 다시 그리고, 바뀌지 않은 입력에는 같은 snapshot을 준다", async () => {
    const { frames } = getStreamFixture("substantive-completed");
    const manual = createManualApi();
    const session = createRunSession({ api: manual.api });
    const { result } = renderHook(() => useRunSession(session));
    expect(result.current.canSend).toBe(true);

    act(() => {
      session.send({ text: "이 문제를 풀어줘" });
    });
    expect(result.current.connection).toBe("streaming");
    expect(result.current.canSend).toBe(false);

    act(() => {
      for (const frame of frames.slice(0, 3)) manual.push(frame);
    });
    expect(result.current.run.lastSeq).toBe(3);
    expect(selectActivities(result.current.run)).toHaveLength(1);

    const before = result.current;
    act(() => manual.push(frames[1])); // 이미 받은 seq
    expect(result.current).toBe(before);

    await act(async () => {
      for (const frame of frames.slice(3)) manual.push(frame);
      manual.end({
        reason: "terminal",
        terminalFrame: frames.at(-1) as never,
        lastEventId: `${frames[0].runId}:${frames.length}`,
      });
    });
    expect(result.current).toMatchObject({
      connection: "idle",
      canSend: true,
      run: { status: "COMPLETED" },
    });
  });

  it("re_explanation.delta는 완료 전 누적되고 단절 재접속·중복 회피 후 canonical response로 교체된다", async () => {
    const { frames } = getStreamFixture("re-explanation-streaming");
    const manual = createManualApi();
    const session = createRunSession({
      api: manual.api,
      backoff: {
        initialDelayMs: 0,
        maxDelayMs: 0,
        multiplier: 1,
        maxAttempts: 2,
      },
      random: () => 0,
    });
    const { result } = renderHook(() => useRunSession(session));

    act(() => {
      session.send({ text: "방금 풀이 다시 설명해줘" });
    });

    // seq 1..5 (첫 deltaIndex=0 포함, run.completed 이전)
    act(() => {
      for (const frame of frames.slice(0, 5)) manual.push(frame);
    });
    expect(result.current.run.response).toBeNull();
    expect(result.current.run.reExplanationText).toBe("양변에 같은 연산을 ");
    expect(selectReExplanationText(result.current.run)).toBe(
      "양변에 같은 연산을 ",
    );
    expect(result.current.run.nextDeltaIndex).toBe(1);

    const beforeDuplicate = result.current;
    act(() => manual.push(frames[4]));
    expect(result.current).toBe(beforeDuplicate);

    // terminal 이전 단절 -> Last-Event-ID(runId:5)로 GET /events 재접속
    await act(async () => {
      manual.end({
        reason: "interrupted",
        cause: "eof",
        lastEventId: `${frames[0].runId}:5` as EventId,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(manual.reconnectCursors).toEqual([`${frames[0].runId}:5`]);
    expect(result.current.connection).toBe("streaming");
    expect(selectReExplanationText(result.current.run)).toBe(
      "양변에 같은 연산을 ",
    );

    // 겹친 replay(seq 5)는 무시되고 seq 6(deltaIndex=1)이 누적된다
    act(() => {
      manual.push(frames[4]);
      manual.push(frames[5]);
    });
    expect(result.current.run.response).toBeNull();
    expect(selectReExplanationText(result.current.run)).toBe(
      "양변에 같은 연산을 적용하기 때문입니다. $x = 2$",
    );

    // page.* + run.completed 도착 시 canonical response로 교체된다
    await act(async () => {
      for (const frame of frames.slice(6)) manual.push(frame);
      manual.end({
        reason: "terminal",
        terminalFrame: frames.at(-1) as never,
        lastEventId: `${frames[0].runId}:${frames.length}` as EventId,
      });
    });
    expect(result.current.run.status).toBe("COMPLETED");
    expect(
      result.current.run.response?.assistantResponse.responsePages[0]
        .resultBlocks[0].body,
    ).toBe("양변에 같은 연산을 적용하는 이유를 설명합니다.");
    expect(result.current.run.reExplanationText).toBe("");
    expect(selectReExplanationText(result.current.run)).toBe("");
    expect(result.current.run.reExplanationDeltas).toEqual([]);
  });
});
