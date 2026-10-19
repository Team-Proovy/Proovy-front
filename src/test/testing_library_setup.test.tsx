import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

// jsdom·Testing Library·jest-dom matcher 설정 확인용 최소 컴포넌트
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setCount(count + 1)}
    >
      {count}회
    </button>
  );
};

describe("테스트 환경", () => {
  it("jsdom에서 렌더링하고 사용자 이벤트를 처리한다", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole("button", { name: "0회" }));

    expect(screen.getByRole("button")).toHaveTextContent("1회");
  });
});
