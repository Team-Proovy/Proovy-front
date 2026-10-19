import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type {
  BrowserFrame,
  PublicRunStatus,
} from "@/shared/contracts/browser_run_v1";
import { getStreamFixture } from "@/test/contracts/browser_run_fixtures";
import { ActivityBox } from "./ActivityBox";
import type { ActivityBoxItem } from "./activity_types";

/**
 * fixture stream의 앞 `upToSeq` frame까지를 Activity 박스 입력으로 접는다(테스트 전용).
 * 상태 계산은 1.90 reducer 몫이라 여기서는 박스가 쓰는 필드만 wire 그대로 옮긴다.
 */
const sliceStream = (name: string, upToSeq = Infinity) => {
  const frames: BrowserFrame[] = getStreamFixture(name).frames.filter(
    (frame) => frame.seq <= upToSeq,
  );
  const items = new Map<string, ActivityBoxItem>();
  let runStatus: PublicRunStatus | null = null;

  for (const frame of frames) {
    switch (frame.type) {
      case "run.created":
        runStatus = frame.payload.status;
        break;
      case "run.canceling":
        runStatus = "CANCELING";
        break;
      case "run.completed":
        runStatus = "COMPLETED";
        break;
      case "run.failed":
        runStatus = "FAILED";
        break;
      case "run.canceled":
        runStatus = "CANCELED";
        break;
      case "activity.started": {
        const { payload } = frame;
        items.set(payload.activityId, {
          activityId: payload.activityId,
          kind: payload.kind,
          label: payload.label,
          phase: "running",
          progressStatus: null,
          methodLabel: "methodLabel" in payload ? payload.methodLabel : null,
          stepProgress: null,
          pageProgress: null,
        });
        break;
      }
      case "activity.updated":
      case "activity.completed":
      case "activity.failed":
      case "activity.canceled": {
        const { payload } = frame;
        const item = items.get(payload.activityId)!;
        if ("status" in payload) item.progressStatus = payload.status ?? null;
        if ("progress" in payload) item.stepProgress = payload.progress;
        if ("totalPages" in payload) {
          item.pageProgress = {
            processedPages: payload.processedPages,
            totalPages: payload.totalPages,
          };
        }
        if (frame.type !== "activity.updated") {
          item.phase = frame.type.replace("activity.", "") as
            | "completed"
            | "failed"
            | "canceled";
        }
        break;
      }
    }
  }
  return { activities: [...items.values()], runStatus, frames };
};

/** fixture frame의 공개 message 전부 (박스는 표시하지 않아야 한다) */
const collectMessages = (frames: BrowserFrame[]) =>
  frames.flatMap((frame) =>
    "message" in frame.payload && frame.payload.message
      ? [frame.payload.message]
      : [],
  );

const getRows = () =>
  within(screen.getByRole("list", { name: "진행 상황" })).getAllByRole(
    "listitem",
  );

const getRowIcon = (row: HTMLElement) =>
  row.querySelector("svg[data-phase]") as SVGElement;

const item = (
  overrides: Partial<ActivityBoxItem> &
    Pick<ActivityBoxItem, "activityId" | "kind" | "label">,
): ActivityBoxItem => ({
  phase: "running",
  progressStatus: null,
  methodLabel: null,
  stepProgress: null,
  pageProgress: null,
  ...overrides,
});

describe("ActivityBox fixture 단면", () => {
  it("진행 중: spinner와 '진행 중' 문구, live region에 현재 Activity를 둔다", () => {
    const { activities, runStatus } = sliceStream("failed-verification", 3);
    render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    const [row] = getRows();
    expect(row).toHaveTextContent("입력 분석");
    expect(row).toHaveTextContent("진행 중");
    expect(getRowIcon(row)).toHaveAttribute("data-phase", "running");
    expect(screen.getByRole("status")).toHaveTextContent("입력 분석 진행 중");
  });

  it("verification 진행 중: n/m과 안전한 라벨만 있고 퍼센트·진행 바·판정이 없다", () => {
    const { activities, runStatus } = sliceStream("substantive-completed", 8);
    const { container } = render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    const rows = getRows();
    expect(rows.map((row) => row.dataset.activityId)).toEqual([
      "activity-1",
      "activity-2",
      "activity-7",
    ]);
    const verification = rows[2];
    expect(verification).toHaveTextContent(
      "단계 검증 · 단계별 함의 검사 · 2/5단계 확인",
    );
    expect(verification).toHaveTextContent("진행 중");
    expect(verification.textContent).not.toMatch(/통과|실패|verified|failed/);
    expect(container.textContent).not.toContain("%");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });

  it("완료: 모든 Activity가 check와 '완료'이고 공개 message는 표시하지 않는다", () => {
    const { activities, runStatus, frames } = sliceStream(
      "substantive-completed",
    );
    const { container } = render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    for (const row of getRows()) {
      expect(getRowIcon(row)).toHaveAttribute("data-phase", "completed");
      expect(row).toHaveTextContent("완료");
    }
    expect(getRows()[2]).toHaveTextContent("5/5단계 확인");
    for (const message of collectMessages(frames)) {
      expect(container.textContent).not.toContain(message);
    }
  });

  it("실패: 실패 Activity는 X와 '실패', 앞선 완료는 그대로다", () => {
    const { activities, runStatus, frames } = sliceStream(
      "failed-verification",
    );
    const { container } = render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    const [analysis, generation] = getRows();
    expect(getRowIcon(analysis)).toHaveAttribute("data-phase", "completed");
    expect(getRowIcon(generation)).toHaveAttribute("data-phase", "failed");
    expect(generation).toHaveTextContent("풀이 작성");
    expect(generation).toHaveTextContent("실패");
    expect(screen.getByRole("status")).toHaveTextContent("풀이 작성 실패");
    for (const message of collectMessages(frames)) {
      expect(container.textContent).not.toContain(message);
    }
  });

  it("중단 중: run이 CANCELING이면 요약·live region·열린 Activity가 '중단 중'이다", () => {
    const { activities, runStatus } = sliceStream("canceled-running", 6);
    expect(runStatus).toBe("CANCELING");
    render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    const [analysis, retrieval] = getRows();
    expect(analysis).toHaveTextContent("완료");
    expect(retrieval).toHaveTextContent("노트 검색");
    expect(retrieval).toHaveTextContent("중단 중");
    expect(getRowIcon(retrieval)).toHaveAttribute("data-phase", "running");
    expect(screen.getByRole("button", { name: /중단 중/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("중단 중");
  });

  it("중단 중: Activity가 없어도 '중단 중'을 표시하고, 그대로 취소되면 박스가 없다", () => {
    // canceled-pending은 run.canceling 없이 PENDING → CANCELED다
    const { activities, runStatus } = sliceStream("canceled-pending");
    expect(activities).toEqual([]);
    expect(runStatus).toBe("CANCELED");

    const { rerender, container } = render(
      <ActivityBox
        activities={[]}
        runStatus="CANCELING"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("중단 중");

    rerender(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("취소: 취소된 Activity는 minus와 '취소됨'이다", () => {
    const { activities, runStatus } = sliceStream("canceled-running");
    render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    const [, retrieval] = getRows();
    expect(getRowIcon(retrieval)).toHaveAttribute("data-phase", "canceled");
    expect(retrieval).toHaveTextContent("취소됨");
    expect(screen.getByRole("status")).toHaveTextContent("노트 검색 취소됨");
  });
});

describe("ActivityBox 표시 규칙", () => {
  it("kind 6종을 받은 순서대로 누적한다", () => {
    const kinds = [
      item({
        activityId: "a1",
        kind: "input_analysis",
        label: "reading_input",
      }),
      item({
        activityId: "a2",
        kind: "solution_generation",
        label: "revising_solution",
      }),
      item({
        activityId: "a3",
        kind: "asset_understanding",
        label: "reading_pages",
        pageProgress: { processedPages: 2, totalPages: 4 },
      }),
      item({
        activityId: "a4",
        kind: "note_retrieval",
        label: "searching_notes",
      }),
      item({
        activityId: "a5",
        kind: "code_execution",
        label: "running_calculation",
        methodLabel: "수치 계산",
      }),
      item({
        activityId: "a6",
        kind: "verification",
        label: "verifying_steps",
        methodLabel: "단계별 함의 검사",
        stepProgress: { checked: 1, total: 3 },
      }),
    ];
    render(
      <ActivityBox
        activities={kinds}
        runStatus="RUNNING"
      />,
    );

    expect(getRows().map((row) => row.textContent)).toEqual([
      "입력 읽기진행 중",
      "풀이 수정진행 중",
      "페이지 읽기 · 2/4페이지진행 중",
      "노트 검색진행 중",
      "계산 실행 · 수치 계산진행 중",
      "단계 검증 · 단계별 함의 검사 · 1/3단계 확인진행 중",
    ]);
  });

  it("4개 상태는 아이콘 모양·문구가 서로 다르고 아이콘은 보조 기술에서 숨긴다", () => {
    const phases = ["running", "completed", "failed", "canceled"] as const;
    render(
      <ActivityBox
        activities={phases.map((phase, index) =>
          item({
            activityId: `a${index}`,
            kind: "input_analysis",
            label: "analyzing_input",
            phase,
          }),
        )}
        runStatus="RUNNING"
      />,
    );

    const expected = {
      running: ["lucide-loader-circle", "진행 중"],
      completed: ["lucide-check", "완료"],
      failed: ["lucide-x", "실패"],
      canceled: ["lucide-minus", "취소됨"],
    };
    getRows().forEach((row, index) => {
      const [iconClass, text] = expected[phases[index]];
      const icon = getRowIcon(row);
      expect(icon).toHaveClass(iconClass);
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(row).toHaveTextContent(text);
    });
    expect(getRowIcon(getRows()[0])).toHaveClass("animate-spin");
  });

  it("후보 답이 담긴 message 등 박스가 모르는 필드는 표시하지 않는다", () => {
    // 1.90 ActivityView처럼 message·failureCode가 더 붙은 값이 들어와도 쓰지 않는다
    const view = {
      ...item({
        activityId: "a1",
        kind: "verification",
        label: "verifying_steps",
        methodLabel: "단계별 함의 검사",
        stepProgress: { checked: 2, total: 5 },
        progressStatus: "retrying",
      }),
      message: "후보 답: x = 42, 2단계 통과",
      failureCode: null,
      closedByRun: false,
    };
    const { container } = render(
      <ActivityBox
        activities={[view]}
        runStatus="RUNNING"
      />,
    );

    expect(container.textContent).not.toMatch(/42|후보|통과/);
    expect(getRows()[0]).toHaveTextContent("다시 시도 중");
  });

  it("박스 전체를 접고 펼 수 있고 접어도 요약과 live region은 남는다", async () => {
    const user = userEvent.setup();
    const { activities, runStatus } = sliceStream("substantive-completed", 8);
    render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
      />,
    );

    const toggle = screen.getByRole("button", { name: /진행 상황/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute(
      "aria-controls",
      screen.getByRole("list").id,
    );

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(toggle).toHaveTextContent("단계 검증 진행 중");
    expect(screen.getByRole("status")).toHaveTextContent("단계 검증 진행 중");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(getRows()).toHaveLength(3);
  });

  it("defaultExpanded=false면 접힌 채로 시작한다", () => {
    const { activities, runStatus } = sliceStream("substantive-completed");
    render(
      <ActivityBox
        activities={activities}
        runStatus={runStatus}
        defaultExpanded={false}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("live region은 하나이고 n/m 진행만 바뀌면 문구가 그대로다", () => {
    const verification = (checked: number, phase: "running" | "completed") =>
      item({
        activityId: "a1",
        kind: "verification",
        label: "verifying_steps",
        methodLabel: "단계별 함의 검사",
        stepProgress: { checked, total: 5 },
        phase,
      });
    const { rerender } = render(
      <ActivityBox
        activities={[verification(2, "running")]}
        runStatus="RUNNING"
      />,
    );
    const status = screen.getByRole("status");
    const before = status.textContent;

    rerender(
      <ActivityBox
        activities={[verification(3, "running")]}
        runStatus="RUNNING"
      />,
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(status.textContent).toBe(before);
    expect(getRows()[0]).toHaveTextContent("3/5단계 확인");

    rerender(
      <ActivityBox
        activities={[verification(5, "completed")]}
        runStatus="COMPLETED"
      />,
    );
    expect(status).toHaveTextContent("단계 검증 완료");
  });

  it("Activity가 없고 중단 중이 아니면 아무것도 그리지 않는다", () => {
    const { container } = render(
      <ActivityBox
        activities={[]}
        runStatus="RUNNING"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
