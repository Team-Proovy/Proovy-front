import { describe, expect, it } from "vitest";
import { resolveApiMode } from "./api_mode";

describe("resolveApiMode", () => {
  it("값이 없으면 실제 Server 모드다", () => {
    expect(resolveApiMode(undefined)).toBe("server");
    expect(resolveApiMode("")).toBe("server");
  });

  it("server·fixture를 그대로 고른다", () => {
    expect(resolveApiMode("server")).toBe("server");
    expect(resolveApiMode("fixture")).toBe("fixture");
  });

  it("모르는 값은 거부한다", () => {
    expect(() => resolveApiMode("fixtures")).toThrow(/VITE_API_MODE/);
    expect(() => resolveApiMode("mock")).toThrow(/VITE_API_MODE/);
  });
});
