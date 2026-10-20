import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationNotices } from "./ConversationNotices";

describe("ConversationNotices 요청 한도 countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("남은 초는 live region에서 읽지 않고, 시작·끝 문구만 알린다", () => {
    render(
      <ConversationNotices
        notices={[
          {
            key: "rejected:RUN4291",
            tone: "warning",
            title: "요청이 많아 잠시 기다려야 해요",
            retryAt: Date.now() + 3000,
          },
        ]}
      />,
    );
    act(() => vi.advanceTimersByTime(10));
    const status = screen.getByRole("status");
    const countdown = screen.getByText("3초 뒤에 다시 보낼 수 있어요.");
    expect(countdown).toHaveAttribute("aria-hidden", "true");
    expect(status).toHaveTextContent("잠시 뒤에 다시 보낼 수 있어요.");

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("2초 뒤에 다시 보낼 수 있어요.")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    // 매초 바뀌는 것은 숨긴 문장뿐이다. 읽히는 문구는 그대로다.
    expect(status.querySelector(".sr-only")?.textContent).toBe(
      "잠시 뒤에 다시 보낼 수 있어요.",
    );

    act(() => vi.advanceTimersByTime(3000));
    expect(status.querySelector(".sr-only")?.textContent).toBe(
      "이제 다시 보낼 수 있어요.",
    );
  });
});
