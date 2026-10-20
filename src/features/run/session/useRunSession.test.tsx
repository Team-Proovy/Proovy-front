import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RunStreamEnd, RunStreamOptions } from "@/features/run/api";
import { selectActivities } from "@/features/run/model";
import type { BrowserFrame } from "@/shared/contracts/browser_run_v1";
import { getStreamFixture } from "@/test/contracts/browser_run_fixtures";
import { createRunSession } from "./run_session";
import type { RunSessionOptions } from "./run_session";
import { useRunSession } from "./useRunSession";

/** frame을 손으로 흘려보내는 api(React 갱신 확인용) */
const createManualApi = () => {
  let current: RunStreamOptions | null = null;
  let finish: (end: RunStreamEnd) => void = () => {};
  const api: RunSessionOptions["api"] = {
    streamConversation: (_request, options) => {
      current = options;
      options.onOpen?.();
      return new Promise((resolve) => (finish = resolve));
    },
    streamRunEvents: () => new Promise(() => {}),
    cancelRun: () => Promise.reject(new Error("unused")),
    getConversationMessages: () => Promise.reject(new Error("unused")),
  };
  return {
    api,
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
});
