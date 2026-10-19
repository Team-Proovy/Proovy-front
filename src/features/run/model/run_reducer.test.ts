import { describe, expect, it } from "vitest";
import {
  toEventId,
  type ActivityStartedFrame,
  type ActivityUpdatedFrame,
  type BrowserFrame,
  type ConversationPage,
  type RunCompletedFrame,
} from "@/shared/contracts/browser_run_v1";
import {
  getConversationFixture,
  getCursorCases,
  getStreamFixture,
  listStreamFixtures,
} from "@/test/contracts/browser_run_fixtures";
import {
  createInitialRunState,
  reduceFrames,
  runReducer,
  selectActivities,
  selectCancel,
  selectCursor,
  selectFailure,
  selectPageBoundaries,
  selectResponse,
  selectRunStatus,
  type RunState,
} from ".";

const streams = listStreamFixtures();
const streamNames = streams.map((stream) => stream.name);

/** replay와 live의 유일한 허용 차이(`sourceReferences[].available`)를 지운다. */
const withoutAvailability = (state: RunState): RunState => {
  if (!state.response) return state;
  const copy = structuredClone(state);
  for (const reference of copy.response!.assistantResponse.sourceReferences ??
    [])
    reference.available = true;
  return copy;
};

/** 화면이 쓰는 결과(selector 출력) */
const selectResult = (state: RunState) => ({
  status: selectRunStatus(state),
  cursor: selectCursor(state),
  activities: selectActivities(state),
  pages: selectPageBoundaries(state),
  response: selectResponse(state),
  failure: selectFailure(state),
  cancel: selectCancel(state),
});

/** terminal 결과만 (대화 조회는 Activity·seq를 주지 않는다) */
const selectOutcome = (state: RunState) => {
  const { status, response, failure, cancel } = selectResult(
    withoutAvailability(state),
  );
  return { status, response, failure, cancel };
};

const activeRunPage = (
  runId: string,
  status: "PENDING" | "RUNNING" | "CANCELING",
  lastSeq: number,
): ConversationPage => ({
  noteId: "123",
  activeRun: { runId, status, lastSeq },
  messages: [],
  nextBefore: null,
});

/** 같은 frame을 두 번씩, 그리고 지금까지 받은 frame을 다시 섞어 넣는다. */
const withDuplicates = (frames: BrowserFrame[]) =>
  frames.flatMap((frame, index) => [
    frame,
    frame,
    ...frames.slice(0, index).reverse(),
  ]);

describe("runReducer — fixture 10개 시나리오", () => {
  it("valid stream fixture가 10개다", () => {
    expect(streams).toHaveLength(10);
  });

  describe.each(streamNames)("%s", (name) => {
    const stream = getStreamFixture(name);
    const full = reduceFrames(stream.frames);
    const lastFrame = stream.frames.at(-1)!;

    it("처음부터 재생하면 최종 상태·cursor·결과가 terminal frame과 맞다", () => {
      expect(full.status).toBe(stream.finalStatus);
      expect(full.runId).toBe(stream.runId);
      expect(full.cursor).toBe(toEventId(stream.runId, lastFrame.seq));
      expect(full.lastSeq).toBe(stream.frames.length);

      const created = stream.frames[0];
      if (created.type !== "run.created") throw new Error("seq 1 run.created");
      expect(full.identity.assistantMessageId).toBe(
        created.payload.assistantMessageId,
      );

      if (lastFrame.type === "run.completed") {
        expect(full.response).toEqual({
          assistantMessageId: lastFrame.payload.assistantMessageId,
          responseDisposition: lastFrame.payload.responseDisposition,
          clarificationReason: lastFrame.payload.clarificationReason ?? null,
          assistantResponse: lastFrame.payload.assistantResponse,
          verificationSummary: lastFrame.payload.verificationSummary ?? [],
        });
      } else {
        expect(full.response).toBeNull();
      }
      if (lastFrame.type === "run.failed") {
        expect(full.failure).toEqual({
          code: lastFrame.payload.code,
          reason: lastFrame.payload.reason ?? null,
          message: lastFrame.payload.message,
          recoverable: lastFrame.payload.recoverable,
        });
      } else {
        expect(full.failure).toBeNull();
      }
      if (lastFrame.type === "run.canceled") {
        expect(full.cancel).toEqual({
          cause: lastFrame.payload.cause,
          message: lastFrame.payload.message,
        });
      } else {
        expect(full.cancel).toBeNull();
      }
    });

    it("Activity는 처음 등장 순서로 ID당 하나이고 wire의 마지막 outcome을 갖는다", () => {
      const startedIds = [
        ...new Set(
          stream.frames
            .filter((frame) => frame.type === "activity.started")
            .map((frame) => frame.payload.activityId),
        ),
      ];
      expect(full.activityOrder).toEqual(startedIds);
      for (const view of selectActivities(full)) {
        const events = stream.frames.filter(
          (frame) =>
            frame.type.startsWith("activity.") &&
            "activityId" in frame.payload &&
            frame.payload.activityId === view.activityId,
        );
        const terminalEvent = events.find(
          (frame) =>
            frame.type !== "activity.started" &&
            frame.type !== "activity.updated",
        );
        if (terminalEvent) {
          expect(view.phase).toBe(terminalEvent.type.replace("activity.", ""));
          expect(view.closedByRun).toBe(false);
        }
      }
    });

    it("page 경계는 pageIndex 순서이고 run.completed pages와 ID가 같다", () => {
      const pages = selectPageBoundaries(full);
      if (lastFrame.type === "run.completed") {
        expect(pages.map((page) => page.responsePageId)).toEqual(
          lastFrame.payload.assistantResponse.responsePages.map(
            (page) => page.responsePageId,
          ),
        );
        expect(pages.map((page) => page.pageIndex)).toEqual(
          pages.map((_, index) => index),
        );
        expect(pages.every((page) => page.completed)).toBe(true);
      } else {
        expect(pages).toEqual([]);
      }
    });

    it("중간 cursor에서 이어 받으면 처음부터 받은 결과와 같다", () => {
      for (let cut = 1; cut < stream.frames.length; cut += 1) {
        const before = reduceFrames(stream.frames.slice(0, cut));
        expect(before.cursor).toBe(toEventId(stream.runId, cut));
        // Server는 cursor seq+1부터 보낸다.
        expect(reduceFrames(stream.frames.slice(cut), before)).toEqual(full);
        // 겹쳐 다시 받아도(cursor보다 앞부터) 같다.
        expect(reduceFrames(stream.frames.slice(cut - 1), before)).toEqual(
          full,
        );
      }
    });

    it("같은 frame을 중복 주입해도 결과가 같다", () => {
      expect(reduceFrames(withDuplicates(stream.frames))).toEqual(full);
    });

    it("진행 중 이미 처리한 seq(같은 event id)를 다시 받으면 state·cursor가 그대로다(같은 참조)", () => {
      for (let cut = 1; cut < stream.frames.length; cut += 1) {
        const atCut = reduceFrames(stream.frames.slice(0, cut));
        const redelivered = stream.frames.slice(0, cut).reverse();
        expect(reduceFrames(redelivered, atCut)).toBe(atCut);
      }
    });

    it("terminal 뒤 frame·대화 조회·heartbeat는 state를 바꾸지 않는다(같은 참조)", () => {
      expect(reduceFrames(stream.frames, full)).toBe(full);
      expect(runReducer(full, { type: "heartbeat" })).toBe(full);
      expect(
        runReducer(full, {
          type: "conversation",
          page: activeRunPage(stream.runId, "RUNNING", 1),
        }),
      ).toBe(full);
      const late: ActivityUpdatedFrame = {
        ...stream.frames[0],
        seq: lastFrame.seq + 1,
        type: "activity.updated",
        payload: {
          activityId: "late",
          kind: "input_analysis",
          status: "in_progress",
        },
      };
      expect(runReducer(full, { type: "frame", frame: late })).toBe(full);
    });

    const activeStatusAt = (cut: number) => {
      const status = reduceFrames(stream.frames.slice(0, cut)).status;
      if (
        status !== "PENDING" &&
        status !== "RUNNING" &&
        status !== "CANCELING"
      )
        throw new Error(`cut ${cut}: active 아님 ${status}`);
      return status;
    };

    it("대화 조회(activeRun)로 초기화한 뒤 cursor 없이 이어 받으면 처음부터 받은 결과와 같다(기본 replay)", () => {
      for (let cut = 1; cut < stream.frames.length; cut += 1) {
        const initialized = runReducer(createInitialRunState(), {
          type: "conversation",
          page: activeRunPage(stream.runId, activeStatusAt(cut), cut),
        });
        expect(initialized.status).toBe(activeStatusAt(cut));
        expect(initialized.cursor).toBeNull();
        expect(reduceFrames(stream.frames, initialized)).toEqual(full);
      }
    });

    it("대화 조회 activeRun.lastSeq를 cursor로 이어 받으면 run 결과·cursor·이후 Activity가 처음부터 받은 결과와 같다(resume: cursor)", () => {
      for (let cut = 1; cut < stream.frames.length; cut += 1) {
        const status = activeStatusAt(cut);
        const initialized = runReducer(createInitialRunState(), {
          type: "conversation",
          page: activeRunPage(stream.runId, status, cut),
          resume: "cursor",
        });
        expect(initialized.status).toBe(status);
        expect(initialized.cursor).toBe(toEventId(stream.runId, cut));

        const resumed = reduceFrames(stream.frames.slice(cut), initialized);
        expect(selectOutcome(resumed)).toEqual(selectOutcome(full));
        expect(resumed.cursor).toBe(full.cursor);
        expect(resumed.pages).toEqual(
          full.pages.filter((page) =>
            stream.frames
              .slice(cut)
              .some(
                (frame) =>
                  frame.type === "response.page.started" &&
                  frame.payload.responsePageId === page.responsePageId,
              ),
          ),
        );
        // cut 뒤에 시작한 Activity는 처음부터 받은 것과 같다. 앞에서 시작한 것은 대화 조회에 없어 복원되지 않는다.
        const startedAfterCut = full.activityOrder.filter(
          (id) => full.activities[id].startedSeq > cut,
        );
        expect(resumed.activityOrder).toEqual(startedAfterCut);
        for (const id of startedAfterCut)
          expect(resumed.activities[id]).toEqual(full.activities[id]);
      }
    });

    it.each(["replay", "cursor"] as const)(
      "frame을 받는 중 더 큰 activeRun.lastSeq 대화 조회가 와도 이어 받은 결과가 처음부터 받은 결과와 같다(resume: %s)",
      (resume) => {
        for (let cut = 1; cut < stream.frames.length; cut += 1) {
          for (let later = cut + 1; later < stream.frames.length; later += 1) {
            const receiving = reduceFrames(stream.frames.slice(0, cut));
            const refetched = runReducer(receiving, {
              type: "conversation",
              page: activeRunPage(stream.runId, activeStatusAt(later), later),
              resume,
            });
            expect(refetched.lastSeq).toBe(receiving.lastSeq);
            expect(refetched.cursor).toBe(receiving.cursor);
            expect(reduceFrames(stream.frames.slice(cut), refetched)).toEqual(
              full,
            );
          }
        }
      },
    );
  });
});

describe("runReducer — replay와 live", () => {
  it("replay-source-unavailable는 sourceReferences[].available 외에 live와 같다", () => {
    const stream = getStreamFixture("replay-source-unavailable");
    expect(stream.live).toBeDefined();
    const replay = reduceFrames(stream.frames);
    const live = reduceFrames(stream.live!);
    expect(replay).not.toEqual(live);
    expect(withoutAvailability(replay)).toEqual(withoutAvailability(live));
    expect(
      replay.response?.assistantResponse.sourceReferences?.map(
        (ref) => ref.available,
      ),
    ).not.toEqual(
      live.response?.assistantResponse.sourceReferences?.map(
        (ref) => ref.available,
      ),
    );
  });
});

describe("runReducer — 대화 조회 초기화", () => {
  it("conversation-active-run은 기본(replay)에서 cursor 없이 run·status만 초기화한다", () => {
    const page = getConversationFixture("conversation-active-run").body.result;
    const state = runReducer(createInitialRunState(), {
      type: "conversation",
      page,
    });
    expect(state.runId).toBe(page.activeRun!.runId);
    expect(state.status).toBe("RUNNING");
    expect(state.lastSeq).toBe(0);
    expect(state.cursor).toBeNull();
    expect(state.identity.assistantMessageId).toBe(
      page.messages.at(-1)!.messageId,
    );
  });

  it("conversation-active-run은 resume: cursor에서 cursor 판정표 active run의 lastSeq로 이어 받을 cursor를 만든다", () => {
    const page = getConversationFixture("conversation-active-run").body.result;
    const state = runReducer(createInitialRunState(), {
      type: "conversation",
      page,
      resume: "cursor",
    });
    const active = getCursorCases().runs.active;
    expect(state.runId).toBe(active.runId);
    expect(state.status).toBe("RUNNING");
    expect(state.lastSeq).toBe(active.lastDurableSeq);
    expect(state.cursor).toBe(toEventId(active.runId, active.lastDurableSeq));
    expect(state.identity.noteId).toBe(page.noteId);
    expect(state.response).toBeNull();
    expect(state.activityOrder).toEqual([]);
  });

  it.each([
    ["conversation-completed", "substantive-with-source"],
    ["conversation-clarification-failed-canceled", "clarification-completed"],
    ["conversation-clarification-failed-canceled", "failed-verification"],
    ["conversation-clarification-failed-canceled", "canceled-pending"],
  ])(
    "%s의 terminal message는 %s stream의 결과와 같다",
    (conversationName, streamName) => {
      const page = getConversationFixture(conversationName).body.result;
      const stream = getStreamFixture(streamName);
      const fromConversation = runReducer(createInitialRunState(), {
        type: "conversation",
        page,
        runId: stream.runId,
      });
      expect(selectOutcome(fromConversation)).toEqual(
        selectOutcome(reduceFrames(stream.frames)),
      );
      // terminal로 초기화한 뒤 replay가 와도 바뀌지 않는다.
      expect(reduceFrames(stream.frames, fromConversation)).toBe(
        fromConversation,
      );
    },
  );

  it("추적 중 run이 끝난 뒤 refetch는 runId를 넘기지 않아도 그 run의 terminal message를 반영한다", () => {
    const page = getConversationFixture("conversation-completed").body.result;
    expect(page.activeRun).toBeNull();
    const stream = getStreamFixture("substantive-with-source");
    const receiving = reduceFrames(stream.frames.slice(0, 5));
    const refetched = runReducer(receiving, { type: "conversation", page });
    expect(refetched.status).toBe("COMPLETED");
    expect(selectOutcome(refetched)).toEqual(
      selectOutcome(reduceFrames(stream.frames)),
    );
  });

  it("대화 조회 status는 뒤로 가지 않는다(RUNNING → PENDING 금지)", () => {
    const stream = getStreamFixture("substantive-completed");
    const running = reduceFrames(stream.frames.slice(0, 3));
    expect(running.status).toBe("RUNNING");
    expect(
      runReducer(running, {
        type: "conversation",
        page: activeRunPage(stream.runId, "PENDING", 2),
      }),
    ).toBe(running);
    const canceling = runReducer(running, {
      type: "conversation",
      page: activeRunPage(stream.runId, "CANCELING", 9),
    });
    expect(canceling.status).toBe("CANCELING");
    expect(canceling.cursor).toBe(running.cursor);
  });

  it("activeRun보다 앞선 seq를 이미 처리했으면 대화 조회가 되돌리지 않는다", () => {
    const stream = getStreamFixture("substantive-completed");
    const atSix = reduceFrames(stream.frames.slice(0, 6));
    expect(
      runReducer(atSix, {
        type: "conversation",
        page: activeRunPage(stream.runId, "RUNNING", 4),
      }),
    ).toBe(atSix);
  });

  it("다른 run의 frame·대화 조회는 반영하지 않는다", () => {
    const stream = getStreamFixture("substantive-completed");
    const other = getStreamFixture("canceled-running");
    const state = reduceFrames(stream.frames.slice(0, 3));
    expect(reduceFrames(other.frames, state)).toBe(state);
    expect(
      runReducer(state, {
        type: "conversation",
        page: activeRunPage(other.runId, "RUNNING", 5),
      }),
    ).toBe(state);
  });
});

describe("runReducer — Activity 규칙", () => {
  const stream = getStreamFixture("canceled-running");
  const [created] = stream.frames;
  const frameAt = <F extends BrowserFrame>(
    seq: number,
    frame: Omit<F, "contractVersion" | "runId" | "seq" | "occurredAt">,
  ) => ({ ...created, ...frame, seq }) as unknown as F;

  const started = (seq: number, activityId: string): ActivityStartedFrame =>
    frameAt<ActivityStartedFrame>(seq, {
      type: "activity.started",
      payload: {
        activityId,
        kind: "verification",
        label: "verifying_steps",
        methodLabel: "대입 검산",
      },
    });
  const updated = (
    seq: number,
    activityId: string,
    checked: number,
  ): ActivityUpdatedFrame =>
    frameAt<ActivityUpdatedFrame>(seq, {
      type: "activity.updated",
      payload: {
        activityId,
        kind: "verification",
        status: "in_progress",
        methodLabel: "대입 검산",
        progress: { checked, total: 3 },
      },
    });

  it("같은 ID는 같은 박스를 갱신하고 새 ID는 뒤에 누적한다", () => {
    const state = reduceFrames([
      created,
      started(2, "a"),
      started(3, "b"),
      updated(4, "a", 1),
      started(5, "a"),
      updated(6, "a", 2),
    ]);
    expect(state.activityOrder).toEqual(["a", "b"]);
    expect(state.activities.a.stepProgress).toEqual({ checked: 2, total: 3 });
    expect(state.activities.a.progressStatus).toBe("in_progress");
    expect(state.activities.a.startedSeq).toBe(2);
    expect(state.status).toBe("RUNNING");
  });

  it("terminal outcome은 같은 ID 이벤트가 다시 와도 바뀌지 않는다", () => {
    const completed = frameAt<BrowserFrame>(3, {
      type: "activity.completed",
      payload: {
        activityId: "a",
        kind: "verification",
        methodLabel: "대입 검산",
        progress: { checked: 3, total: 3 },
      },
    });
    const done = reduceFrames([created, started(2, "a"), completed]);
    const after = reduceFrames([started(4, "a"), updated(5, "a", 1)], done);
    expect(after.activities.a).toEqual(done.activities.a);
    expect(after.activities.a.phase).toBe("completed");
    // 내용은 무시해도 받은 frame이므로 cursor는 올라간다.
    expect(after.cursor).toBe(toEventId(created.runId, 5));
  });

  it("activity terminal은 진행 sub-state를 지우고 message를 terminal payload 값으로 바꾼다", () => {
    const retrying = frameAt<ActivityUpdatedFrame>(3, {
      type: "activity.updated",
      payload: {
        activityId: "a",
        kind: "verification",
        status: "retrying",
        message: "다시 확인하고 있습니다.",
        methodLabel: "대입 검산",
        progress: { checked: 1, total: 3 },
      },
    });
    const completed = frameAt<BrowserFrame>(4, {
      type: "activity.completed",
      payload: {
        activityId: "a",
        kind: "verification",
        methodLabel: "대입 검산",
        progress: { checked: 3, total: 3 },
      },
    });
    const during = reduceFrames([created, started(2, "a"), retrying]);
    expect(during.activities.a.progressStatus).toBe("retrying");
    expect(during.activities.a.message).toBe("다시 확인하고 있습니다.");
    // message 없는 updated는 이전 message를 유지한다.
    const quiet = reduceFrames([updated(4, "a", 2)], during);
    expect(quiet.activities.a.message).toBe("다시 확인하고 있습니다.");
    const done = reduceFrames([completed], during);
    expect(done.activities.a.phase).toBe("completed");
    expect(done.activities.a.progressStatus).toBeNull();
    expect(done.activities.a.message).toBeNull();
  });

  it("started 없는 후속 이벤트는 박스를 만들지 않는다", () => {
    const state = reduceFrames([created, updated(2, "ghost", 1)]);
    expect(state.activityOrder).toEqual([]);
    expect(state.status).toBe("PENDING");
    expect(state.cursor).toBe(toEventId(created.runId, 2));
  });

  it("CANCELING 뒤 activity frame이 와도 RUNNING으로 돌아가지 않는다", () => {
    const state = reduceFrames(stream.frames.slice(0, 7));
    expect(state.status).toBe("CANCELING");
    expect(state.activities["activity-8"].phase).toBe("canceled");
  });

  it.each([
    ["run.completed", "completed"],
    ["run.failed", "failed"],
    ["run.canceled", "canceled"],
  ] as const)(
    "terminal 시점에 열린 Activity는 %s 결과에 맞춰 닫힌 표시로 투영한다",
    (terminalType, phase) => {
      const terminalSource = streams.find(
        (fixture) => fixture.frames.at(-1)!.type === terminalType,
      )!;
      const terminal = {
        ...terminalSource.frames.at(-1)!,
        runId: created.runId,
        seq: 3,
      } as BrowserFrame;
      const state = reduceFrames([created, started(2, "open"), terminal]);
      expect(state.activities.open.phase).toBe("running");
      const [view] = selectActivities(state);
      expect(view.phase).toBe(phase);
      expect(view.closedByRun).toBe(true);
      // 진행 중에는 투영하지 않는다.
      const [running] = selectActivities(
        reduceFrames([created, started(2, "open")]),
      );
      expect(running.phase).toBe("running");
      expect(running.closedByRun).toBe(false);
    },
  );

  it("selectActivities는 같은 state에 같은 배열, 바뀌지 않은 Activity에 같은 객체를 준다", () => {
    const first = reduceFrames([created, started(2, "a"), started(3, "b")]);
    expect(selectActivities(first)).toBe(selectActivities(first));
    const second = reduceFrames([updated(4, "b", 1)], first);
    const [a1, b1] = selectActivities(first);
    const [a2, b2] = selectActivities(second);
    expect(a2).toBe(a1);
    expect(b2).not.toBe(b1);
    expect(b2.stepProgress).toEqual({ checked: 1, total: 3 });
  });

  it("heartbeat는 cursor를 바꾸지 않는다", () => {
    const state = reduceFrames([created, started(2, "a")]);
    expect(runReducer(state, { type: "heartbeat" })).toBe(state);
    expect(selectCursor(state)).toBe(toEventId(created.runId, 2));
  });
});

describe("runReducer — 검증 전 본문·후보 답·가짜 퍼센트 없음", () => {
  const completedStreams = streams.filter(
    (stream) => stream.frames.at(-1)!.type === "run.completed",
  );

  it.each(completedStreams.map((stream) => stream.name))(
    "%s: run.completed 전 state에는 응답 본문·제목·plainText가 없다",
    (name) => {
      const stream = getStreamFixture(name);
      const completed = stream.frames.at(-1) as RunCompletedFrame;
      const { assistantResponse } = completed.payload;
      const texts = [
        assistantResponse.plainText,
        ...assistantResponse.responsePages.flatMap((page) => [
          ...(page.title ? [page.title] : []),
          ...page.resultBlocks.map((block) => block.body),
        ]),
      ];
      for (let cut = 1; cut < stream.frames.length; cut += 1) {
        const state = reduceFrames(stream.frames.slice(0, cut));
        expect(state.response).toBeNull();
        const serialized = JSON.stringify(state);
        for (const text of texts)
          expect(serialized).not.toContain(JSON.stringify(text).slice(1, -1));
        expect(serialized).not.toMatch(/resultBlocks|plainText|"body"|"title"/);
      }
    },
  );

  it.each(streamNames)(
    "%s: state 어디에도 퍼센트·delta·candidate 필드가 없다",
    (name) => {
      const stream = getStreamFixture(name);
      for (let cut = 1; cut <= stream.frames.length; cut += 1) {
        const state = reduceFrames(stream.frames.slice(0, cut));
        const keys = JSON.stringify(
          { ...state, response: null },
          (_key, value: unknown) => value,
        ).match(/"([A-Za-z_]+)":/g);
        for (const key of keys ?? [])
          expect(key).not.toMatch(/percent|delta|candidate|token/i);
      }
    },
  );
});
