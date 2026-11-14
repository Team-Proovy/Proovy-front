import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import type {
  AssistantConversationMessage,
  RunCompletedPayload,
} from "@/shared/contracts/browser_run_v1";
import {
  CONTRACT_WARM_UP_TIMEOUT_MS,
  getConversationFixture,
  getStreamFixture,
  warmUpContractFixtures,
} from "@/test/contracts/browser_run_fixtures";
import { AssistantResponseView, toCompletedAssistantResponse } from ".";
import { formatSympyStatement } from "./sympy_statement";
import {
  ASSURANCE_SCOPE_DESCRIPTIONS,
  CROSS_CHECK_TEXTS,
  SOLUTION_HIDDEN_TEXT,
  STEP_CHECK_SCOPE_NOTICE,
  STEP_WITHHELD_TEXT,
} from "./response_labels";

/** v1.1 확장(2.07) stream fixture의 `run.completed` payload */
const completedPayloadOf = (streamName: string): RunCompletedPayload => {
  const frame = getStreamFixture(streamName).frames.find(
    (candidate) => candidate.type === "run.completed",
  );
  if (frame?.type !== "run.completed")
    throw new Error(`${streamName}에 run.completed 없음`);
  return frame.payload;
};

const renderStream = (streamName: string) =>
  render(<AssistantResponseView response={completedPayloadOf(streamName)} />)
    .container;

const badgeGroup = () => screen.getByRole("group", { name: "응답 검증 상태" });

const EXTENSION_STREAMS = [
  "verified-multiple-choice-with-read-back",
  "unverified-disagreement",
  "mixed-scope-completed",
  "not-applicable-proof",
  "re-explanation-completed",
  "hide-answer-completed",
  "hide-solution-completed",
];

beforeAll(warmUpContractFixtures, CONTRACT_WARM_UP_TIMEOUT_MS);

describe("보증 범위 배지", () => {
  it.each([
    ["verified-multiple-choice-with-read-back", "verified", "검증됨"],
    ["unverified-disagreement", "unverified", "미검증"],
    ["not-applicable-proof", "not_applicable", "검증 대상 아님"],
    // 검증됨 + 검증 대상 아님 섞임은 not_applicable을 집계에서 빼 verified다(사용자 결정 2026-11-12).
    ["mixed-scope-completed", "verified", "검증됨"],
  ])("%s → %s 배지 '%s'", (streamName, scope, label) => {
    renderStream(streamName);
    const group = badgeGroup();
    const badge = group.querySelector("[data-assurance-scope]");
    expect(badge).toHaveAttribute("data-assurance-scope", scope);
    expect(badge).toHaveTextContent(new RegExp(`^${label}$`));
    expect(within(group).queryByText("추가 설명")).toBeNull();
  });

  it("재설명이면 보증 범위 배지 옆에 '추가 설명'을 따로 붙이고 단계 검산은 없다", () => {
    const container = renderStream("re-explanation-completed");
    const group = badgeGroup();
    expect(within(group).getByText("검증 대상 아님")).toBeVisible();
    expect(within(group).getByText("추가 설명")).toBeVisible();
    expect(group.children).toHaveLength(2);
    expect(
      container.querySelector('[data-response-kind="re_explanation"]'),
    ).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "단계별 검산" })).toBeNull();
  });

  it.each(EXTENSION_STREAMS)(
    "%s: 배지 본문에 단계 수(n/m)가 없다",
    (streamName) => {
      renderStream(streamName);
      for (const badge of screen
        .getByRole("article")
        .querySelectorAll("[data-assurance-scope]"))
        expect(badge.textContent).not.toMatch(/\d/);
    },
  );

  it("v1.1 응답은 Phase 1 검증 요약·solution 배지를 그리지 않는다(배지가 두 말을 하지 않게)", () => {
    const container = renderStream("re-explanation-completed");
    expect(screen.queryByRole("heading", { name: "검증 요약" })).toBeNull();
    expect(container.querySelector("[data-verification]")).toBeNull();
    expect(screen.queryByText("검증된 풀이")).toBeNull();
  });

  it("확장 이전 응답은 배지 없이 지금처럼 그린다", () => {
    const container = renderStream("substantive-completed");
    expect(screen.queryByRole("group", { name: "응답 검증 상태" })).toBeNull();
    expect(container.querySelector("[data-assurance-scope]")).toBeNull();
    expect(screen.queryByRole("heading", { name: "단계별 검산" })).toBeNull();
  });

  it("세 필드 중 하나라도 없으면 확장 이전처럼 그린다(근거 없는 배지 없음)", () => {
    const payload = completedPayloadOf("unverified-disagreement");
    render(
      <AssistantResponseView
        response={{ ...payload, solutionChecks: undefined }}
      />,
    );
    expect(screen.queryByRole("group", { name: "응답 검증 상태" })).toBeNull();
  });

  it("substantive가 아니면 배지를 그리지 않는다", () => {
    const payload = completedPayloadOf("not-applicable-proof");
    render(
      <AssistantResponseView
        response={{ ...payload, responseDisposition: "clarification_only" }}
      />,
    );
    expect(screen.queryByRole("group", { name: "응답 검증 상태" })).toBeNull();
  });
});

describe("단계별 검산 접이식", () => {
  it("문제마다 접힌 채로 시작하고, 펼치면 KaTeX 수식과 ✓ 상태를 보인다", async () => {
    const user = userEvent.setup();
    const container = renderStream("verified-multiple-choice-with-read-back");

    const section = screen.getByRole("region", { name: "단계별 검산" });
    const toggle = within(section).getByRole("button", { name: /15번 문제/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // 접힌 동안 단계를 그리지 않는다. 머리글에 단계 수가 없다.
    expect(container.querySelector("[data-check-result]")).toBeNull();
    expect(toggle.textContent).not.toMatch(/\d+\s*\/\s*\d+/);

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const steps = within(section)
      .getByRole("list", { name: "단계별 검산 결과" })
      .querySelectorAll("li[data-check-result]");
    expect(steps).toHaveLength(9);
    expect(
      [...steps].map((step) => step.getAttribute("data-check-result")),
    ).toEqual([
      "not_checked",
      "not_checked",
      "verified",
      "verified",
      "not_checked",
      "verified",
      "verified",
      "verified",
      "verified",
    ]);
    // 설명의 $…$ 수식은 KaTeX로 그린다.
    expect(steps[2].querySelector(".katex")).not.toBeNull();
    expect(
      within(steps[2] as HTMLElement).getByText("식 검산 통과"),
    ).toBeVisible();
    expect(
      within(steps[0] as HTMLElement).getByText("검산 대상 아님"),
    ).toBeVisible();
    // 검산식은 SymPy 문법 그대로 보인다.
    expect(steps[2]).toHaveTextContent("diff(f(x), x) = 3*x*(x-2)");
    expect(screen.getByText(CROSS_CHECK_TEXTS.agrees)).toBeVisible();

    await user.click(toggle);
    expect(container.querySelector("[data-check-result]")).toBeNull();
  });

  it("미검증: ✗(검산 실패) 단계와 독립 답 불일치를 보인다", async () => {
    const user = userEvent.setup();
    renderStream("unverified-disagreement");
    await user.click(screen.getByRole("button", { name: /23번 문제/ }));
    const falsified = document.querySelector(
      '[data-check-result="falsified"]',
    ) as HTMLElement;
    expect(within(falsified).getByText("식 검산 실패")).toBeVisible();
    expect(screen.getByText(CROSS_CHECK_TEXTS.disagrees)).toBeVisible();
  });

  it("여러 문제: Read-back 순서대로 문제 배지를 붙이고, 번호 없는 문제는 순서로 부른다", async () => {
    const user = userEvent.setup();
    renderStream("mixed-scope-completed");
    const section = screen.getByRole("region", { name: "단계별 검산" });
    const toggles = within(section).getAllByRole("button");
    expect(toggles.map((toggle) => toggle.textContent)).toEqual([
      "22번 문제검증됨",
      "9번 문제검증됨",
      "문제 3검증됨",
      "3번 문제검증 대상 아님",
    ]);

    // unparseable = 검산 안 됨
    await user.click(toggles[1]);
    const unparseable = section.querySelector(
      '[data-check-result="unparseable"]',
    ) as HTMLElement;
    expect(within(unparseable).getByText("식 검산 안 됨")).toBeVisible();

    // plain_text 설명은 markdown·수식 없이 글자 그대로 그린다.
    await user.click(toggles[2]);
    const plain = section.querySelector(
      '[data-description-format="plain_text"]',
    ) as HTMLElement;
    expect(plain.textContent).toBe("`x = 4` 를 대입하면 성립한다");
    expect(plain.querySelector("code")).toBeNull();
  });

  it("정답 숨김(hide_answer): 단계 종류와 ✓만 보이고 설명·수식은 없다", async () => {
    const user = userEvent.setup();
    const container = renderStream("hide-answer-completed");
    await user.click(screen.getByRole("button", { name: /15번 문제/ }));
    const steps = container.querySelectorAll("li[data-check-result]");
    expect(steps).toHaveLength(9);
    for (const step of steps) {
      expect(step).toHaveAttribute("data-withheld", "true");
      expect(step).toHaveTextContent(STEP_WITHHELD_TEXT);
      expect(step.querySelector(".katex")).toBeNull();
      expect(step.querySelector("code")).toBeNull();
    }
    expect(steps[8]).toHaveTextContent("9단계 · 보기 선택");
    expect(steps[8]).toHaveTextContent("식 검산 통과");
  });

  it("풀이 숨김(hide_solution): 단계 목록 없이 배지와 안내만 그린다", async () => {
    const user = userEvent.setup();
    const container = renderStream("hide-solution-completed");
    expect(badgeGroup()).toHaveTextContent("검증됨");
    await user.click(screen.getByRole("button", { name: /22번 문제/ }));
    expect(screen.getByText(SOLUTION_HIDDEN_TEXT)).toBeVisible();
    expect(container.querySelector("[data-check-result]")).toBeNull();
  });
});

describe("검산 범위 안내 (ADR 0017 §3)", () => {
  it("설명 문장은 검산 대상이 아니라는 안내를 단계 목록과 함께(접혀 있어도) 보인다", async () => {
    const user = userEvent.setup();
    renderStream("verified-multiple-choice-with-read-back");
    const section = screen.getByRole("region", { name: "단계별 검산" });
    expect(within(section).getByText(STEP_CHECK_SCOPE_NOTICE)).toBeVisible();
    expect(STEP_CHECK_SCOPE_NOTICE).toMatch(/설명 문장.*검산 대상이 아닙니다/);

    // 단계 결과 문구는 식에 대한 것임을 드러낸다.
    await user.click(
      within(section).getByRole("button", { name: /15번 문제/ }),
    );
    const verifiedStep = section.querySelector(
      '[data-check-result="verified"]',
    ) as HTMLElement;
    expect(within(verifiedStep).getByText("식 검산 통과")).toBeVisible();
    expect(within(section).queryByText(/^검산 통과$/)).toBeNull();
  });

  it("검증됨 머리글 설명도 설명 문장이 검산 대상이 아님을 적는다", () => {
    renderStream("verified-multiple-choice-with-read-back");
    expect(
      screen.getByText(ASSURANCE_SCOPE_DESCRIPTIONS.verified),
    ).toBeVisible();
    expect(ASSURANCE_SCOPE_DESCRIPTIONS.verified).toContain(
      "설명 문장은 검산 대상이 아닙니다",
    );
  });

  it("crossCheck.stepCheckCompleted가 false면 단계 검산을 마치지 못했다고 덧붙인다", async () => {
    const user = userEvent.setup();
    const payload = structuredClone(
      completedPayloadOf("unverified-disagreement"),
    );
    payload.solutionChecks![0].crossCheck = {
      independentAnswerAgrees: true,
      stepCheckCompleted: false,
    };
    render(<AssistantResponseView response={payload} />);
    await user.click(screen.getByRole("button", { name: /23번 문제/ }));
    expect(
      screen.getByText(
        `${CROSS_CHECK_TEXTS.agrees} ${CROSS_CHECK_TEXTS.stepCheckIncomplete}`,
      ),
    ).toBeVisible();
  });
});

describe("check block (사용자 풀이 점검)", () => {
  it("v1.1 응답에서도 사용자 풀이 점검의 step 상태를 그대로 보인다(AI 답 배지와 대상이 다르다)", () => {
    const payload = completedPayloadOf("hide-answer-completed");
    const hasCheckBlock = payload.assistantResponse.responsePages.some((page) =>
      page.resultBlocks.some((block) => block.kind === "check"),
    );
    expect(hasCheckBlock).toBe(true);
    const container = renderStream("hide-answer-completed");
    expect(badgeGroup()).toHaveTextContent("검증됨");
    const checkBlock = container.querySelector(
      '[data-block-kind="check"]',
    ) as HTMLElement;
    expect(checkBlock.querySelector("[data-step-status]")).not.toBeNull();
    // solution block의 Phase 1 배지는 그리지 않는다.
    expect(container.querySelector("[data-verification]")).toBeNull();
  });
});

describe("대화 조회", () => {
  it("v1.1 확장을 그대로 넘겨 재설명 메시지에 '추가 설명'을 붙인다", () => {
    const page = getConversationFixture(
      "conversation-verified-then-re-explanation",
    ).body.result;
    const assistants = page.messages.filter(
      (message): message is AssistantConversationMessage =>
        message.role === "assistant",
    );
    const responses = assistants.map((message) =>
      toCompletedAssistantResponse(message.assistant),
    );
    expect(responses.map((response) => response?.responseKind)).toEqual([
      "standard",
      "re_explanation",
    ]);

    const { unmount } = render(
      <AssistantResponseView response={responses[0]!} />,
    );
    expect(badgeGroup()).toHaveTextContent(/^검증됨$/);
    unmount();

    render(<AssistantResponseView response={responses[1]!} />);
    expect(badgeGroup()).toHaveTextContent("검증 대상 아님추가 설명");
  });
});

describe("formatSympyStatement", () => {
  it.each([
    [{ name: "f", value: "Lambda(x, x**2)" }, "f = Lambda(x, x**2)"],
    [{ cond: "k > 0" }, "k > 0"],
    [{ cond: "n > 0", covers: "Integers" }, "n > 0  (Integers)"],
    [{ lhs: "f(2)", rhs: "k-4" }, "f(2) = k-4"],
    [{ name: "m", lhs: "f(2)", rhs: "k-4" }, "m := f(2) = k-4"],
    [{ value: "f(-1)", choice: 3 }, "f(-1)  → 보기 3"],
    [null, null],
  ])("%j → %s", (statement, expected) => {
    expect(formatSympyStatement(statement)).toBe(expected);
  });
});
