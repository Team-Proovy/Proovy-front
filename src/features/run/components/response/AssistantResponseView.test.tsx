import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { RunCompletedPayload } from "@/shared/contracts/browser_run_v1";
import {
  getConversationFixture,
  getStreamFixture,
} from "@/test/contracts/browser_run_fixtures";
import {
  AssistantResponseView,
  toCompletedAssistantResponse,
  type CompletedAssistantResponse,
} from ".";

/** stream fixture의 `run.completed` payload(canonical 응답) */
const completedPayloadOf = (streamName: string): RunCompletedPayload => {
  const frame = getStreamFixture(streamName).frames.find(
    (candidate) => candidate.type === "run.completed",
  );
  if (frame?.type !== "run.completed")
    throw new Error(`${streamName}에 run.completed 없음`);
  return frame.payload;
};

const renderResponse = (response: CompletedAssistantResponse) =>
  render(<AssistantResponseView response={response} />).container;

const substantive = (
  overrides: Partial<CompletedAssistantResponse> &
    Pick<CompletedAssistantResponse, "assistantResponse">,
): CompletedAssistantResponse => ({
  responseDisposition: "substantive",
  verificationSummary: [],
  ...overrides,
});

describe("fixture 응답", () => {
  it("substantive: main은 펼치고 thread_like는 같은 메시지 안 접이식 section이다", async () => {
    const user = userEvent.setup();
    const container = renderResponse(
      completedPayloadOf("substantive-completed"),
    );

    const article = screen.getByRole("article", { name: "AI 응답" });
    expect(article).toHaveAttribute("data-disposition", "substantive");
    expect(screen.getByRole("heading", { name: "본문" })).toBeVisible();
    expect(screen.getByText("본문 풀이가 여기 있다.")).toBeVisible();

    const toggle = screen.getByRole("button", { name: "보조 펼치기" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // 접힌 동안에는 block을 그리지 않고 aria-controls 대상만 남긴다.
    expect(screen.queryByText("스레드에 붙는 보조 설명이다.")).toBeNull();
    expect(
      document.getElementById(toggle.getAttribute("aria-controls") ?? ""),
    ).not.toBeNull();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("보조 접기");
    expect(screen.getByText("스레드에 붙는 보조 설명이다.")).toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAccessibleName("보조 펼치기");
    // 접힌 동안에는 block을 그리지 않고 aria-controls 대상만 남긴다.
    expect(screen.queryByText("스레드에 붙는 보조 설명이다.")).toBeNull();
    expect(
      document.getElementById(toggle.getAttribute("aria-controls") ?? ""),
    ).not.toBeNull();

    // page는 article 바로 아래 형제 section이다(중첩 없음). 링크·route 이동이 없다.
    const sections = container.querySelectorAll<HTMLElement>(
      "section[data-presentation]",
    );
    expect(
      [...sections].map((section) => section.dataset.presentation),
    ).toEqual(["main", "thread_like"]);
    expect(
      container.querySelector(
        "section[data-presentation] section[data-presentation]",
      ),
    ).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });

  it("substantive: verified 풀이와 step 마커, direct 검증 요약을 보인다", () => {
    renderResponse(completedPayloadOf("substantive-completed"));

    expect(screen.getByText("검증된 풀이")).toBeInTheDocument();
    const steps = within(
      screen.getByRole("list", { name: "단계별 검증 상태" }),
    ).getAllByRole("listitem");
    expect(steps).toHaveLength(1);
    expect(steps[0]).toHaveTextContent("1단계: 검증됨");

    const summary = screen.getByRole("region", { name: "검증 요약" });
    expect(summary).toHaveTextContent("직접 검증");
    expect(summary).toHaveTextContent("모든 단계를 실행 검사로 확인");
    expect(summary).not.toHaveTextContent("보조 검사");
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("with-source: marker를 snapshot label 텍스트로만 보이고 수식을 그린다", () => {
    const container = renderResponse(
      completedPayloadOf("substantive-with-source"),
    );

    const markers = container.querySelectorAll("[data-source-marker]");
    expect(markers.length).toBeGreaterThan(0);
    markers.forEach((marker) =>
      expect(marker).toHaveTextContent("개념 노트 3–4쪽"),
    );
    expect(container).not.toHaveTextContent("[[source:");
    expect(container).not.toHaveTextContent("sref-1");
    expect(container).not.toHaveTextContent("note-alpha");
    expect(container.querySelector("a, button")).toBeNull();
    expect(container.querySelector(".katex")).not.toBeNull();

    // anchor가 있는 step은 body의 그 구간을 함께 보인다.
    const steps = within(
      screen.getByRole("list", { name: "단계별 검증 상태" }),
    ).getAllByRole("listitem");
    expect(steps.map((step) => step.dataset.stepStatus)).toEqual([
      "verified",
      "verified",
    ]);
    expect(steps[1]).toHaveTextContent("따라서");
  });

  it("삭제된 출처(available=false)도 label만 같게 보이고 삭제 표시는 하지 않는다", () => {
    const container = renderResponse(
      completedPayloadOf("replay-source-unavailable"),
    );

    expect(container.querySelector("[data-source-marker]")).toHaveTextContent(
      "개념 노트 3–4쪽",
    );
    expect(container).not.toHaveTextContent("삭제");
  });

  it("clarification_only: 추가 정보 요청과 사유를 보이고 검증 요약이 없다", () => {
    renderResponse(completedPayloadOf("clarification-completed"));

    expect(screen.getByRole("article")).toHaveAttribute(
      "data-disposition",
      "clarification_only",
    );
    expect(screen.getByText("추가 정보가 필요합니다")).toBeInTheDocument();
    expect(
      screen.getByText(/어떤 대상을 말하는지 분명하지 않습니다/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("어떤 문제의 풀이를 원하는지 알려 주세요."),
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: "검증 요약" })).toBeNull();
  });

  it("unsupported_only: 고정 미지원 안내만 보이고 검증·출처가 없다", () => {
    const payload = completedPayloadOf("unsupported-only-completed");
    const container = renderResponse(payload);

    expect(screen.getByRole("article")).toHaveAttribute(
      "data-disposition",
      "unsupported_only",
    );
    expect(screen.getByText("지원하지 않는 요청입니다")).toBeInTheDocument();
    expect(
      screen.getByText(
        "변형·연습문제 생성은 아직 지원하지 않는다. 기존 문제의 풀이·검산·설명을 요청해 주세요.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: "검증 요약" })).toBeNull();
    expect(container.querySelector("[data-source-marker]")).toBeNull();
    expect(screen.queryByText("추가 정보가 필요합니다")).toBeNull();
  });

  it("대화 조회 COMPLETED 메시지를 같은 컴포넌트로 그린다", () => {
    const page = getConversationFixture("conversation-completed").body.result;
    const assistant = page.messages.find(
      (message) => message.role === "assistant",
    );
    if (assistant?.role !== "assistant") throw new Error("assistant 없음");

    const response = toCompletedAssistantResponse(assistant.assistant);
    if (!response) throw new Error("canonical 응답 없음");
    const container = renderResponse(response);

    expect(screen.getByText("검증된 풀이", { selector: "h3" })).toBeVisible();
    expect(container.querySelector("[data-source-marker]")).toHaveTextContent(
      "개념 노트 3–4쪽",
    );
  });

  it("canonical 응답이 없는 메시지(실패·취소·placeholder)는 null이다", () => {
    const page = getConversationFixture(
      "conversation-clarification-failed-canceled",
    ).body.result;
    const results = page.messages
      .filter((message) => message.role === "assistant")
      .map((message) =>
        message.role === "assistant"
          ? [
              message.status,
              toCompletedAssistantResponse(message.assistant) !== null,
            ]
          : [],
      );

    expect(results).toContainEqual(["FAILED", false]);
    expect(results).toContainEqual(["CANCELED", false]);
    expect(results).toContainEqual(["COMPLETED", true]);
  });
});

describe("ResultBlock", () => {
  it("5종 block을 page·block 순서대로 그린다", async () => {
    const user = userEvent.setup();
    const container = renderResponse(
      substantive({
        assistantResponse: {
          plainText: "",
          responsePages: [
            {
              responsePageId: "p1",
              presentation: "main",
              resultBlocks: [
                { blockId: "b1", kind: "rich_text", body: "첫째 rich" },
                {
                  blockId: "b2",
                  kind: "solution",
                  body: "둘째 solution",
                  verification: "verified",
                },
                { blockId: "b3", kind: "notice", body: "셋째 notice" },
              ],
            },
            {
              responsePageId: "p2",
              presentation: "thread_like",
              title: "검산",
              resultBlocks: [
                { blockId: "b4", kind: "check", body: "넷째 check" },
                {
                  blockId: "b5",
                  kind: "explanation",
                  body: "다섯째 explanation",
                },
              ],
            },
          ],
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "검산 펼치기" }));

    const blocks = [
      ...container.querySelectorAll<HTMLElement>("[data-block-kind]"),
    ];
    expect(blocks.map((block) => block.dataset.blockKind)).toEqual([
      "rich_text",
      "solution",
      "notice",
      "check",
      "explanation",
    ]);
    expect(blocks.map((block) => block.textContent)).toEqual([
      "첫째 rich",
      expect.stringContaining("둘째 solution"),
      "셋째 notice",
      "넷째 check",
      "다섯째 explanation",
    ]);
  });

  it("혼합 요청의 notice를 안내로 구분해 보인다", () => {
    renderResponse(
      substantive({
        assistantResponse: {
          plainText: "",
          responsePages: [
            {
              responsePageId: "p1",
              presentation: "main",
              resultBlocks: [
                {
                  blockId: "b1",
                  kind: "solution",
                  body: "풀이",
                  verification: "verified",
                },
                {
                  blockId: "b2",
                  kind: "notice",
                  body: "변형 문제 생성은 아직 지원하지 않습니다.",
                },
              ],
            },
          ],
        },
      }),
    );

    expect(screen.getByRole("note", { name: "안내" })).toHaveTextContent(
      "변형 문제 생성은 아직 지원하지 않습니다.",
    );
    expect(screen.queryByText("지원하지 않는 요청입니다")).toBeNull();
  });

  it("solution step별 verified·failed·unconfirmed 마커와 미확인 사유를 보인다", () => {
    renderResponse(
      substantive({
        assistantResponse: {
          plainText: "",
          responsePages: [
            {
              responsePageId: "p1",
              presentation: "main",
              resultBlocks: [
                {
                  blockId: "b1",
                  kind: "solution",
                  body: "가 단계. 나 단계. 다 단계.",
                  verification: "partially_verified",
                  stepMarks: [
                    {
                      stepId: "s1",
                      status: "verified",
                      anchor: { start: 0, end: 5 },
                    },
                    {
                      stepId: "s2",
                      status: "failed",
                      anchor: { start: 6, end: 11 },
                    },
                    {
                      stepId: "s3",
                      status: "unconfirmed",
                      reason: "수치 검사가 시간 안에 끝나지 않았다",
                      anchor: { start: 12, end: 17 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );

    const steps = within(
      screen.getByRole("list", { name: "단계별 검증 상태" }),
    ).getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringMatching(/^1단계: 검증됨가 단계\.$/),
      expect.stringMatching(/^2단계: 오류나 단계\.$/),
      expect.stringContaining(
        "3단계: 확인되지 않음다 단계.확인되지 않은 이유: 수치 검사가 시간 안에 끝나지 않았다",
      ),
    ]);
    expect(screen.getByText("일부만 검증된 풀이")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "일부 단계나 주장은 확인되지 않았습니다",
    );
    // step id는 화면에 내보이지 않는다.
    expect(screen.queryByText(/s[123]\b/)).toBeNull();
  });

  it("unverified 풀이에 미검증 안내를 붙인다", () => {
    renderResponse(
      substantive({
        assistantResponse: {
          plainText: "",
          responsePages: [
            {
              responsePageId: "p1",
              presentation: "main",
              resultBlocks: [
                {
                  blockId: "b1",
                  kind: "solution",
                  body: "풀이 본문\n\n확인되지 않은 범위: 답 전체",
                  verification: "unverified",
                },
              ],
            },
          ],
        },
      }),
    );

    expect(screen.getByText("검증되지 않은 풀이")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "이 풀이는 검증을 마치지 못했습니다",
    );
    expect(screen.getByText("확인되지 않은 범위: 답 전체")).toBeVisible();
  });

  it("check는 step 마커와 첫 오류, 미확인 안내를 보인다", () => {
    renderResponse(
      substantive({
        assistantResponse: {
          plainText: "",
          responsePages: [
            {
              responsePageId: "p1",
              presentation: "main",
              resultBlocks: [
                {
                  blockId: "b1",
                  kind: "check",
                  body: "제출한 풀이를 확인했다.",
                  firstErrorStepId: "s2",
                  stepMarks: [
                    { stepId: "s1", status: "verified" },
                    { stepId: "s2", status: "failed" },
                    {
                      stepId: "s3",
                      status: "unconfirmed",
                      reason: "앞 단계 오류",
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );

    const steps = within(
      screen.getByRole("list", { name: "단계별 검증 상태" }),
    ).getAllByRole("listitem");
    expect(steps[1]).toHaveTextContent("2단계: 오류첫 오류");
    expect(steps[0]).not.toHaveTextContent("첫 오류");
    expect(steps[2]).toHaveTextContent("확인되지 않은 이유: 앞 단계 오류");
    expect(screen.getByRole("note")).toHaveTextContent(
      "일부 단계는 확인되지 않았습니다",
    );
  });
});

describe("검증 요약 direct/supporting", () => {
  it("supporting을 보조 검사로 구분하고 완전한 정답 보장으로 표시하지 않는다", () => {
    renderResponse(
      substantive({
        assistantResponse: {
          plainText: "",
          responsePages: [
            {
              responsePageId: "p1",
              presentation: "main",
              resultBlocks: [
                {
                  blockId: "b1",
                  kind: "solution",
                  body: "증명",
                  verification: "verified",
                  solutionId: "sol-a",
                },
                {
                  blockId: "b2",
                  kind: "solution",
                  body: "계산",
                  verification: "verified",
                  solutionId: "sol-b",
                },
              ],
            },
          ],
        },
        verificationSummary: [
          {
            solutionId: "sol-a",
            overallCoverage: "supporting",
            claims: [
              {
                claimId: "c1",
                coverage: "supporting",
                methodLabel: "특수값 대입 검사",
                unconfirmedSteps: [
                  { stepId: "s9", reason: "일반 경우 미확인" },
                ],
              },
            ],
          },
          {
            solutionId: "sol-b",
            overallCoverage: "direct",
            claims: [
              { claimId: "c2", coverage: "direct", methodLabel: "계산 실행" },
            ],
          },
        ],
      }),
    );

    const summary = screen.getByRole("region", { name: "검증 요약" });
    const [supporting, direct] = within(summary)
      .getAllByRole("listitem")
      .filter((item) => item.parentElement?.parentElement === summary);

    expect(supporting).toHaveAttribute("data-coverage", "supporting");
    expect(supporting).toHaveTextContent("보조 검사");
    expect(supporting).toHaveTextContent("완전한 정답을 보장하지는 않습니다");
    expect(supporting).not.toHaveTextContent("직접 검증");
    expect(supporting).toHaveTextContent(
      "확인되지 않은 단계: 일반 경우 미확인",
    );

    expect(direct).toHaveAttribute("data-coverage", "direct");
    expect(direct).toHaveTextContent("직접 검증");
    expect(direct).not.toHaveTextContent("보조 검사");

    expect(summary).not.toHaveTextContent(/sol-[ab]|c[12]\b|s9/);
  });
});

describe("정답 숨기기", () => {
  it("공개된 힌트 block만 그리고 plainText·id 등 block 밖 값은 DOM에 넣지 않는다", () => {
    const hidden = "SECRET-ANSWER-42";
    const container = renderResponse(
      substantive({
        assistantResponse: {
          // 계약상 plainText는 공개 block에서 파생된다. renderer가 쓰지 않는지 sentinel로 확인한다.
          plainText: `힌트 ${hidden}`,
          responsePages: [
            {
              responsePageId: `page-${hidden}`,
              presentation: "main",
              title: "힌트",
              resultBlocks: [
                {
                  blockId: `block-${hidden}`,
                  kind: "solution",
                  body: "양변을 인수분해해 보세요.\n\n확인되지 않은 범위: 답 전체",
                  verification: "unverified",
                  solutionId: null,
                  claimIds: [],
                  stepMarks: [
                    {
                      stepId: `step-${hidden}`,
                      status: "unconfirmed",
                      reason: "답을 공개하지 않는 요청",
                    },
                  ],
                },
              ],
            },
          ],
          sourceReferences: [],
        },
        verificationSummary: [],
      }),
    );

    expect(screen.getByText("양변을 인수분해해 보세요.")).toBeVisible();
    expect(container.innerHTML).not.toContain(hidden);
    expect(screen.queryByRole("region", { name: "검증 요약" })).toBeNull();
  });
});

describe("과거 문자열 응답", () => {
  it("문자열 응답을 받지 않는다(타입 검사)", () => {
    const legacyContent = "과거 문자열 응답";
    // @ts-expect-error 문자열 응답 fallback이 없다.
    const legacyResponse: CompletedAssistantResponse = legacyContent;

    expect(typeof legacyResponse).toBe("string");
  });
});
