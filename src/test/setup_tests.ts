import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest globals를 쓰지 않으므로 Testing Library 자동 cleanup을 직접 등록한다.
afterEach(() => {
  cleanup();
});
